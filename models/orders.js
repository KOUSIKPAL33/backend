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
  createdAt: { type: Date, default: Date.now },
  deliveryLocation: String
});

module.exports = mongoose.model('orders', OrderSchema);