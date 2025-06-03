const express = require('express');
const addressrouter = express.Router();
const auth = require("../middleware/auth.js");
const { addAddressController, deleteAddressController } = require('../controller/addresscontroller.js');


addressrouter.post('/add', auth, addAddressController);
addressrouter.delete('/delete', auth, deleteAddressController);



module.exports = addressrouter;