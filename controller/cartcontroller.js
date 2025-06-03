const CartProductModel = require("../models/cartproduct.js");
const UserModel = require("../models/user.js");

const addToCartItemController = async (request, response) => {
  try {
    const userId = request.user.id;
    const { productId, productDetails } = request.body;

    if (!productId) {
      return response.status(400).json({
        message: "Provide productId and product details",
        error: true,
        success: false
      });
    }

    const checkItemCart = await UserModel.findOne({
      _id: userId,
      "shopping_cart.productId": productId
    });


    if (checkItemCart) {
      return response.status(400).json({
        message: "Item already in cart"
      });
    }

    const cartItem = new CartProductModel({
      quantity: 1,
      userId: userId,
      productId: productId
    });

    const save = await cartItem.save();

    const updateCartUser = await UserModel.updateOne(
      { _id: userId },
      {
        $push: {
          shopping_cart: {
            productId,
            name: productDetails.name,
            imgSrc: productDetails.imgSrc,
            option: productDetails.option,
            price: productDetails.price,
            quantity: 1,
          },
        },
      }
    );

    if (!updateCartUser.modifiedCount) {
      return response.status(500).json({
        message: "Failed to update user's shopping cart",
        error: true,
        success: false,
      });
    }

    // console.log("Updated User's Cart:", updateCartUser);

    return response.json({
      data: save,
      message: "Item added successfully",
      error: false,
      success: true
    });
  } catch (error) {
    console.error("Error in addToCartItemController:", error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
};


const getCartItemController = async (request, response) => {
  try {
    const userId = request.user.id;
    const user = await UserModel.findById(userId).select('shopping_cart');

    if (!user) {
      return response.status(404).json({
        message: 'User not found',
        error: true,
        success: false,
      });
    }

    return response.json({
      data: user.shopping_cart,
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

const updateCartItemQtyController = async (request, response) => {
  try {
    const userId = request.user.id
    const { _id, qty } = request.body

    if (!_id || !qty) {
      return response.status(400).json({
        message: "provide _id, qty"
      })
    }

    const updateCartitem = await CartProductModel.updateOne({
      _id: _id,
      userId: userId
    }, {
      quantity: qty
    })

    return response.json({
      message: "Update cart",
      success: true,
      error: false,
      data: updateCartitem
    })

  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    })
  }
}

const deleteCartItemQtyController = async (request, response) => {
  try {
    const userId = request.user.id;
    const { productId } = request.body;

    if (!productId) {
      return response.status(400).json({ success: false, message: "Product ID is required." });
    }
    console.log(userId, productId);
    const mongoose = require('mongoose');
    const ObjectId = mongoose.Types.ObjectId;
    const productObjectId = new ObjectId(productId);
    console.log(productObjectId);
    const result = await UserModel.findOneAndUpdate(
      { _id: userId }, // Match the user by their ID
      { $pull: { shopping_cart: { productId: productObjectId } } },
      { new: true } // Return the updated document
    );

    if (!result) {
      return response.status(404).json({ success: false, message: "User not found or product not in cart." });
    }

    return response.status(200).json({
      success: true,
      message: "Item deleted successfully.",
      data: result.shopping_cart  // Return the updated shopping cart items
    });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return response.status(500).json({
      success: false,
      message: "An error occurred while deleting the item.",
    });
  }
};



module.exports = {
  addToCartItemController,
  getCartItemController,
  updateCartItemQtyController,
  deleteCartItemQtyController
};