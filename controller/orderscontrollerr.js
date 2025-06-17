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

    // 1. Group items by shopName
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



    // 2. Convert map to array
    const ordersbyshop = Array.from(ordersByShopMap.values());

    // 3. Create new order document
    const newOrder = await Order.create({
      userId,
      ordersbyshop,
      totalAmount,
      deliveryLocation,
      status: 'pending'
    });

    // 4. Update user document
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
  try {
    const orders = await Order.find({
      'ordersbyshop.shopName': shopName
    }).populate('userId', 'name mobileno');

    const filteredOrders = orders.map(order => {
      const shopOrder = order.ordersbyshop.find(shop => shop.shopName === shopName);

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
