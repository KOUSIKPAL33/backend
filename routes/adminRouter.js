const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/adminUser');
const JWT_SECRET = process.env.JWT_SECRET || "yoursecretkey";
const mongoose = require('mongoose');


// Generic schema for product
const productSchema = new mongoose.Schema({
  Shop_name: String,
  Image: String,
  Name: String,
  Category: String,
  Price: Number,
  Available: Boolean,
}, { strict: false }); // allow dynamic fields if any


router.post('/loginadmin', async (req, res) => {
  const { email, password, shop } = req.body;
  try {
    const admin = await AdminUser.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email" });
    }

    //const isMatch = await bcrypt.compare(password, admin.password);
    if (password != admin.password) {
      return res.status(400).json({ message: "Invalid password" });
    }
    if (shop != admin.shop) {
      return res.status(400).json({ message: "Invalid shop name" });
    }
    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ success: true, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// PUT: Update product by ID in a shop-specific collection
router.put('/update/:id', async (req, res) => {
    // console.log("PUT /update/:id hit");
    const { id } = req.params;
    const { name, price, available, shop_name } = req.body;
    if (!shop_name) {
      return res.status(400).json({ error: 'Shop name is required' });
    }

    try {
      const Product = mongoose.model(shop_name, productSchema, shop_name);
      const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        Name: name,
        Price: price,
        Available: available
      },
      { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;
    const { shop_name } = req.body;

    if (!shop_name) {
        return res.status(400).json({ error: 'Shop name is required' });
    }

    try {
        const Product = mongoose.model(shop_name, productSchema, shop_name);
        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
