const express = require('express');
const cartRouter = express.Router();
const auth = require("../middleware/auth.js");
const  {addToCartItemController, deleteCartItemQtyController, getCartItemController, updateCartItemQtyController} = require( "../controller/cartcontroller.js");


cartRouter.post('/create',auth,addToCartItemController);
cartRouter.get('/get',auth,getCartItemController);
cartRouter.put('/updatequantity',auth,updateCartItemQtyController);
cartRouter.delete('/delete',auth,deleteCartItemQtyController);

module.exports = cartRouter;