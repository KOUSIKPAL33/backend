const nodemailer = require("nodemailer");
require("dotenv").config(); // At the top
const express = require('express');
const routers = express.Router();
const user = require('../models/user');
const Contactus = require('../models/contactus');
const auth = require("../middleware/auth.js")
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const saltRounds = 10;

const multer = require('multer');
const path = require('path');
const { request } = require("http");
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

routers.post("/checkmail", async (req, res) => {
  try {
    const { email } = req.body;
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.json({ exists: true });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({ exists: false, error: "Internal server error" });
  }
});

routers.post("/createuser", async (req, res) => {
  try {
    const existingUser = await user.findOne({ email: req.body.email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already exists" });
    }
    const finalpassword = req.body.password || "google_oauth";
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashpassword = bcrypt.hashSync(finalpassword, salt);
    await user.create({
      name: req.body.name,
      email: req.body.email,
      password: hashpassword,
      mobileno: req.body.mobileno,
    });

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
    subject: "Welcome to InCampusFood 🎉",
    text: `Hello ${req.body.name},

        Welcome to InCampusFood! 🎉  
        Your account has been created successfully.

        You can now explore our menu, order your favorite meals, and enjoy hassle-free campus dining.

        If you have any questions or need help, feel free to reach out to our support team.

        We're excited to have you onboard! 🚀

        Best regards,  
        InCampusFood Team
        `
        };



    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.json({ success: false, message: "Failed to send email" });
      res.json({ success: true });
    });
  } catch (error) {
    console.error("Error creating user:", error);
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
      req.body.password = req.body.password || "google_oauth";
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



// Update user profile (name, email, mobile, profile image)
routers.put("/update-profile", auth, upload.single("profileImage"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, mobile } = req.body;
    let updateData = { name, email, mobileno: mobile };

    if (req.file && req.file.filename) {
      updateData.profileImage = `/image/${req.file.filename}`;
    }

    const updatedUser = await user.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        mobileno: updatedUser.mobileno,
        profileImage: updatedUser.profileImage,
        addresses: updatedUser.addresses,
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

routers.get("/user", auth, async (req, res) => {
  try {
    const userData = await user.findById(req.user.id);
    if (userData) {
      res.json({
        name: userData.name,
        cartItems: userData.shopping_cart,
        mobileno: userData.mobileno,
        email: userData.email,
        addresses: userData.addresses,
        profileImage: userData.profileImage,
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
//send otp for signup
routers.post("/sendotp", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    const transporter = require("nodemailer").createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Signup OTP",
      text: `Your OTP for registration is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Failed to send OTP email:", error);
        return res.json({ success: false, message: "Failed to send OTP" });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error("Error in /sendotp:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
// Verify OTP for signup
routers.post("/verifyotp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const storedOtp = otpStore[email];
    if (!storedOtp) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // OTP is correct, remove it from store
    delete otpStore[email];

    res.json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


//send otp for reset password
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
    text: `Hello,

        We received a request to reset your password.
        Here is your One-Time Password (OTP):

        ${otp}

        This OTP is valid for the next 15 minutes. 
        If you did not request a password reset, please ignore this email.

        Best regards,
        InCampusFood Team
        `
  };


  transporter.sendMail(mailOptions, (error, info) => {
    if (error) return res.json({ success: false, message: "Failed to send email" });
    res.json({ success: true });
  });
});

// POST /verify-otp
routers.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const storedOtp = otpStore[email];
  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
  }

  return res.json({ success: true, message: "OTP verified" });
});
// POST /reset-password
routers.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // Find user
    const curruser = await user.findOne({ email });
    if (!curruser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    curruser.password = hashedPassword;
    await curruser.save();

    // Clear OTP
    delete otpStore[email];
    // Send confirmation email
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
      subject: "Password Changed Successfully",
      text: `Hello,

            Your account password has been changed successfully. 
            If you made this change, no further action is required. 

            If you did not request this change, please reset your password immediately or contact our support team.

            Best regards,
            InCampusFood Team`
    };


    transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.json({ success: false, message: "Failed to send email" });
      res.json({ success: true });
    });

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


routers.post('/contactus', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    await Contactus.create({ name, email, message });
    res.json({ success: true, message: "Message stored successfully" });
  } catch (error) {
    console.error("Error saving contact message:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
module.exports = routers;
