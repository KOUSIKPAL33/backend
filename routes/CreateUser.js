const nodemailer = require("nodemailer");
require("dotenv").config(); // At the top
const express = require('express');
const routers = express.Router();
const user = require('../models/user');
const auth = require("../middleware/auth.js")
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const saltRounds = 10;

routers.post("/createuser", async (req, res) => {
    try {
        const existingUser = await user.findOne({ email: req.body.email });
        if (existingUser) {
            return res.json({ success: false, message: "Email already exists" });
        }
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashpassword = bcrypt.hashSync(req.body.password, salt);
        await user.create({
            name: req.body.name,
            email: req.body.email,
            password: hashpassword,
            mobileno: req.body.mobileno,
        });
        res.json({ success: true });
    } catch (error) {
        console.log(error);
        res.json({ success: false });
    }
}
);

// Login User
routers.post("/loginuser",
    async (req, res) => {
        try {
            const { email } = req.body;
            let userData = await user.findOne({ email });


            if (!userData || !bcrypt.compareSync(req.body.password, userData.password)) {
                return res.status(400).json({ errors: "Invalid credentials" });
            }

            const token = jwt.sign({ id: userData._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.json({ success: true, token });
        } catch (error) {
            console.error("Error during login:", error);
            res.json({ success: false });
        }
    }
);

routers.get("/user", auth, async (req, res) => {
    try {
        const userData = await user.findById(req.user.id); 
        if (userData) {
            res.json({
                name: userData.name, 
                cartItems: userData.shopping_cart,
                mobileno:userData.mobileno,
                email:userData.email,
                addresses:userData.addresses,
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
let otpStore = {};

routers.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const userExist = await user.findOne({ email });
  if (!userExist) return res.json({ success: false, message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return res.json({ success: false, message: "Failed to send email" });
    res.json({ success: true });
  });
});

routers.post("/verify-otp-reset", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Check OTP
    const storedOtp = otpStore[email];
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    // Find user
    const curruser = await user.findOne({ email });
    if (!curruser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    curruser.password = hashedPassword;
    await curruser.save();

    // Clear OTP after use
    delete otpStore[email];

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


module.exports = routers;
