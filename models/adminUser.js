const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({

  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  shop: { type: String, required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  profileImage: { type: String, default: "" },
  address: { type: String, default: "" },
});

module.exports = mongoose.model('adminUsers', adminUserSchema);
