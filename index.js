const express = require('express');
const cors = require("cors");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
const connecttomongo = require("./db");
connecttomongo();

// Allowed origins list
const allowedOrigins = [
    "http://localhost:5173",
    "https://frontend-ecru-five-46.vercel.app"
];

// CORS Middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    next();
});


app.use(express.json());

// Routes
app.use('/api/', require("./routes/CreateUser"));
app.use('/api/', require("./routes/ShopsData"));
app.use('/api/cart', require("./routes/cartRouter"));
app.use('/api/address',require("./routes/addressRoter"));
app.use('/api/', require("./routes/adminRouter"));
app.use('/api/order',require("./routes/ordersRouter"));
app.use('/image', express.static(path.join(__dirname, 'public/image')));


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);
    } else {
        console.error(err);
    }
});
