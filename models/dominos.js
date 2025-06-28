const mongoose = require('mongoose');

const dominosSchema = new mongoose.Schema({
  Shop_name: { type: String, required: true },
  Name: { type: String, required: true },
  Category: { type: String, required: true },
  Options: {
    Regular: { type: Number, required: true },
    Medium: { type: Number, required: true },
    Large: { type: Number, required: true }
  },
  Image: { type: String, required: true },
  Available: { type: Boolean, default: true }
});

module.exports = mongoose.model('Dominos', dominosSchema, 'dominos');