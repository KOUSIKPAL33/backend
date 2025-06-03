const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.post('/yummpy_data', async (_, res) => {
    try {
        const food_items_yummpy = await mongoose.connection.db.collection("yummpy").find({}).toArray();
        const foodCategory_yummpy = await mongoose.connection.db.collection("category_yummpy").find({}).toArray();

        res.status(200).send([food_items_yummpy, foodCategory_yummpy]);
    } catch (error) {
        console.error("Error fetching yummpy data:", error.message);
        res.status(500).send("Server error");
    }
});


router.post('/kathijunction_data', async(_, res) => {
    try {
        const food_items_kathi= await mongoose.connection.db.collection("kathijunction").find({}).toArray();
        const foodCategory_kathi = await mongoose.connection.db.collection("category_kathijunction").find({}).toArray();

        res.status(200).send([food_items_kathi,foodCategory_kathi]);
    } catch (error) {
        console.error("Error fetching kathijunction data:", error.message);
        res.status(500).send("Server error");
    }
})
router.post('/dominos_data',async(_, res) => {
    try {
        const food_items_dominos= await mongoose.connection.db.collection("dominos").find({}).toArray();
        const foodCategory_dominos = await mongoose.connection.db.collection("category_dominos").find({}).toArray();
        res.status(200).send([food_items_dominos,foodCategory_dominos]);
    } catch (error) {
        console.error("Error fetching dominos data:", error.message);
        res.status(500).send("Server error");
    }
})

module.exports = router;