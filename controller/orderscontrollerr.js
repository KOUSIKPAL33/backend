const User = require('../models/user');
const Order = require('../models/orders');

const createOrderController = async (req, res) => {
  const userId = req.user.id;
  const { items, deliveryLocation, totalAmount } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || !items || items.length === 0) {
      return res.status(400).json({ error: "User not found or cart is empty" });
    }

    // Group items by shopName
    const ordersByShopMap = new Map();

    items.forEach(item => {
      const shopName = item.shopname || "unknown";
      const formattedItem = {
        imgSrc: item.imgSrc,
        itemName: item.name,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price
      };

      if (!ordersByShopMap.has(shopName)) {
        ordersByShopMap.set(shopName, {
          shopName,
          status: 'pending',
          items: [formattedItem],
          shopTotal: formattedItem.totalPrice
        });
      } else {
        const shopEntry = ordersByShopMap.get(shopName);
        shopEntry.items.push(formattedItem);
        shopEntry.shopTotal += formattedItem.totalPrice;
      }
    });

    const ordersbyshop = Array.from(ordersByShopMap.values());

    const newOrder = await Order.create({
      userId,
      ordersbyshop,
      totalAmount,
      deliveryLocation: {
        name: deliveryLocation.name,
        mobileno: deliveryLocation.mobileno,
        location: deliveryLocation.location
      },
      status: 'pending'
    });

    user.orders.push(newOrder._id);
    user.shopping_cart = [];
    await user.save();

    res.status(200).json({ message: "Order created successfully", order: newOrder });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
};


const getShopOrdersController = async (req, res) => {
  const { shopName } = req.params;
  if (!shopName) {
    return res.status(400).json({ error: "Shop name is required" });
  }

  try {
    const orders = await Order.find({
      'ordersbyshop.shopName': { $regex: new RegExp(`^${shopName}$`, 'i') }  // case-insensitive match
    }).populate('userId', 'name mobileno');

    const filteredOrders = orders.map(order => {
      const shopOrder = order.ordersbyshop.find(
        shop => shop.shopName.toLowerCase() === shopName.toLowerCase() // also ensure this match is exact case-insensitive
      );

      return {
        orderId: order._id,
        createdAt: order.createdAt,
        deliveryLocation: order.deliveryLocation,
        user: {
          name: order.userId.name,
          mobile: order.userId.mobileno
        },
        shopOrder
      };
    });

    res.status(200).json(filteredOrders);
  } catch (err) {
    console.error("Shop Order Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch shop orders" });
  }
};



const getOrdersController = async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};



const updateOrtdersController = async (req, res) => {

};

const cancelOrderController = async (request, response) => {
};



module.exports = {
  createOrderController,
  getOrdersController,
  getShopOrdersController,
  updateOrtdersController,
  cancelOrderController,
};
