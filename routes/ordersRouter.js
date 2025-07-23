const express = require('express');
const ordersRouter = express.Router();
const auth = require("../middleware/auth.js");
const  {createOrderController, cancelOrderController, getOrdersController, updateOrtdersController,getShopOrdersController, createRazorpayOrderController, verifyPaymentController} = require( "../controller/orderscontrollerr.js");


ordersRouter.post('/create',auth,createOrderController);
ordersRouter.post('/create-razorpay-order',auth,createRazorpayOrderController);
ordersRouter.post('/verify-payment',auth,verifyPaymentController);
ordersRouter.get('/get',auth,getOrdersController);
ordersRouter.put('/update',auth,updateOrtdersController);
ordersRouter.delete('/cancel',auth,cancelOrderController);

ordersRouter.get('/shopget/:shopName',auth,getShopOrdersController);

module.exports = ordersRouter;