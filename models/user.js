const mongoose = require('mongoose');
const orders = require('./orders');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, },
  email: { type: String, required: true, },
  password: { type: String, required: true, },
  mobileno: { type: String, required: true, },
  shopping_cart: [{
    productId: { type: mongoose.Schema.ObjectId, required: true,},
    shopname:{type: String, required: true,},
    name: { type: String, required: true, },
    imgSrc: { type: String, required: true, },
    option: { type: String, default: "NA", },
    price: { type: Number, required: true, },
    quantity: { type: Number, default: 1, },
    },
  ],
  addresses: [{
    name: { type: String,  required: true, },
    mobileno: { type: String, required: true, },
    location: { type: String, required: true, },
    }
  ],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'orders' }],
   profileImage: { type: String, default: "" },
});

module.exports = mongoose.model('users', userSchema);