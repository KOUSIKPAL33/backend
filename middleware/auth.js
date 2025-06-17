const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        console.log("No token provided.");
        return res.status(401).json({ message: "Access Denied: No Token Provided" });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next(); 
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(403).json({ message: "Invalid Token" });
    }
};

module.exports = auth;
