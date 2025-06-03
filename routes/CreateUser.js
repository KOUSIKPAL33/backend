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

module.exports = routers;
