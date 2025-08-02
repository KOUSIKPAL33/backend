const User = require('../models/user');
const Order = require('../models/orders');

const createOrderController = async (req, res) => {
  const userId = req.user.id;
  const { items, deliveryLocation, totalAmount, paymentMethod, paymentStatus, paymentId } = req.body;

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
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: paymentStatus || 'pending',
      paymentId: paymentId || null,
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
  const { orderId, shopName, newStatus } = req.body;

  if (!orderId || !shopName || !newStatus) {
    return res.status(400).json({ error: "Order ID, shop name, and new status are required" });
  }

  // Validate status
  const validStatuses = ['pending', 'preparing', 'out for delivery', 'delivered'];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: "Invalid status. Must be one of: pending, preparing, out for delivery, delivered" });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Find the specific shop order and update its status
    const shopOrderIndex = order.ordersbyshop.findIndex(
      shop => shop.shopName.toLowerCase() === shopName.toLowerCase()
    );

    if (shopOrderIndex === -1) {
      return res.status(404).json({ error: "Shop order not found" });
    }

    // Update the shop order status
    order.ordersbyshop[shopOrderIndex].status = newStatus;

    // Update the overall order status based on all shop orders
    const allShopStatuses = order.ordersbyshop.map(shop => shop.status);
    
    // If all shops are delivered, mark the entire order as delivered
    if (allShopStatuses.every(status => status === 'delivered')) {
      order.status = 'delivered';
    } else if (allShopStatuses.some(status => status === 'out for delivery')) {
      order.status = 'out for delivery';
    } else if (allShopStatuses.some(status => status === 'preparing')) {
      order.status = 'preparing';
    } else {
      order.status = 'pending';
    }

    await order.save();

    res.status(200).json({ 
      message: "Order status updated successfully", 
      updatedOrder: order,
      updatedShopOrder: order.ordersbyshop[shopOrderIndex]
    });

  } catch (err) {
    console.error("Order Update Error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

const cancelOrderController = async (request, response) => {
  
};

// Razorpay integration functions
const createRazorpayOrderController = async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount, currency, receipt } = req.body;

    const options = {
      amount: amount,
      currency: currency,
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ orderId: order.id });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};

const verifyPaymentController = async (req, res) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = process.env.Razorpay_key_secret;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (razorpay_signature === expectedSignature) {
      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ verified: false });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
};

module.exports = {
  createOrderController,
  getOrdersController,
  getShopOrdersController,
  updateOrtdersController,
  cancelOrderController,
  createRazorpayOrderController,
  verifyPaymentController,
};
