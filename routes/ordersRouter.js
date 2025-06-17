const express = require('express');
const ordersRouter = express.Router();
const auth = require("../middleware/auth.js");
const  {createOrderController, cancelOrderController, getOrdersController, updateOrtdersController,getShopOrdersController} = require( "../controller/orderscontrollerr.js");


ordersRouter.post('/create',auth,createOrderController);
ordersRouter.get('/get',auth,getOrdersController);
ordersRouter.put('/update',auth,updateOrtdersController);
ordersRouter.delete('/cancel',auth,cancelOrderController);

ordersRouter.get('/shopget/:shopName',auth,getShopOrdersController);

module.exports = ordersRouter;