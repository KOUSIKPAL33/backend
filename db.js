const mongoose = require('mongoose');
require('dotenv').config();
const mongourl = process.env.MONGO_URL;
const connectToMongo = async () => {
    try {
        await mongoose.connect(mongourl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
}

module.exports = connectToMongo;
