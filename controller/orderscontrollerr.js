const User = require('../models/user');
const Order = require('../models/orders');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);

const createOrderController = async (req, res) => {
  const userId = req.user.id;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
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


const stripeOrderController = async (req, res) => {
  const userId = req.user.id;
  const { items, deliveryLocation, totalAmount } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: 'Order from InCampusFoods',
          },
          unit_amount: Math.round(totalAmount * 100), // Stripe expects amount in paise
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'http://localhost:5173/Myorders?success=true',
      cancel_url: 'http://localhost:5173/Checkout?canceled=true',
      metadata: {
        userId,
        items: JSON.stringify(items),
        deliveryLocation: JSON.stringify(deliveryLocation),
        totalAmount: totalAmount
      },
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    res.status(500).json({ error: 'Stripe session creation failed' });
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


module.exports = {
  createOrderController,
  getOrdersController,
  getShopOrdersController,
  updateOrtdersController,
  cancelOrderController,
  stripeOrderController
};
