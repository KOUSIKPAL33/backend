const User = require('../models/user');
const Order = require('../models/orders');

const createOrderController = async (req, res) => {
  const userId = req.user.id;
  const { items, deliveryLocation, totalAmount } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user || items.length === 0) {
      return res.status(400).json({ error: "User not found or cart is empty" });
    }

    const formattedItems = items.map(item => ({
      shopName: item.shopname || "unknown",
      itemName: item.name,
      imgSrc: item.imgSrc,
      quantity: item.quantity,
      price: item.price,
      totalPrice:(item.quantity*item.price)
    }));

    const newOrder = await Order.create({
      userId,
      items: formattedItems,
      totalAmount,
      deliveryLocation
    });

    // Update user orders list and clear cart
    user.orders.push(newOrder._id);
    user.shopping_cart = [];
    await user.save();

    res.status(200).json({ message: "Order created successfully", order: newOrder });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
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
  updateOrtdersController,
  cancelOrderController
};
