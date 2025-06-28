const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/adminUser');
const JWT_SECRET = process.env.JWT_SECRET || "yoursecretkey";
const mongoose = require('mongoose');
const Dominos = require('../models/dominos');


// Generic schema for product
const productSchema = new mongoose.Schema({
  Shop_name: String,
  Image: String,
  Name: String,
  Category: String,
  Price: Number,
  Available: Boolean,
}, { strict: false });


const multer = require('multer');
const path = require('path');
// Save to public/image folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/image'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });


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
router.put('/update/:id', upload.single('image'), async (req, res) => {
  //console.log("PUT /update/:id hit");
  const { id } = req.params;
  const { name, price, available, shop_name } = req.body;
  if (!shop_name) {
    return res.status(400).json({ error: 'Shop name is required' });
  }

  try {
    const Product = mongoose.model(shop_name, productSchema, shop_name);
    //console.log(shop_name)
    const updateFields = {
      Name: name,
      Price: price,
      Available: available
    };
    if (req.file && req.file.filename) {
      updateFields.Image = `image/${req.file.filename}`;
    }
    console.log(updateFields);
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateFields,
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

// Update Dominos product by ID
router.put('/dominos/update/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const name = req.body.name;
  let options = req.body.options;
  const available = req.body.available;
  try {
    if (!name || !options || available === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const updateFields = {
      Name: name,
      Options: JSON.parse(options),
      Available: available
    };
    if (req.file && req.file.filename) {
      updateFields.Image = `image/${req.file.filename}`;
    }
    const updated = await Dominos.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updated) {
      console.log("object not found");
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product: updated });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Internal server error' });
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



router.post('/product/add', upload.single('image'), async (req, res) => {
  const { name, price, shop, category } = req.body;
  const imageName = req.file.filename;

  try {
    if (!name || !price || !shop || !imageName || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Dynamically compile model for the specific shop collection
    const ShopModel = mongoose.model(`${shop}`, productSchema, `${shop}`);

    const newProduct = new ShopModel({
      Name: name,
      Price: price,
      Image: `image/${imageName}`,
      Category: category,
      Available: true,
      Shop_name: shop
    });

    await newProduct.save();

    res.status(200).json({ message: 'Product added successfully' });
  } catch (err) {
    console.error('Error saving product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
