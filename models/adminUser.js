const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({

  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  shop: { type: String, required: true },
});

module.exports = mongoose.model('adminUsers', adminUserSchema);
