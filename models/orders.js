const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  ordersbyshop: [{
    shopName: String,
    status: { type: String, enum: ['pending', 'preparing', 'out for delivery', 'delivered'], default: 'pending' },
    items: [{
      imgSrc: String,
      itemName: String,
      quantity: Number,
      price: Number,
      totalPrice: Number,
    }],
    shopTotal:Number,
  }],
  totalAmount: Number,
  status: { type: String, enum: ['pending', 'preparing', 'out for delivery', 'delivered'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  paymentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  deliveryLocation:{name: String, mobileno: String, location: String,_id: mongoose.Schema.Types.ObjectId},
});

module.exports = mongoose.model('orders', OrderSchema);