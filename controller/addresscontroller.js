const mongoose = require('mongoose');
const UserModel = require("../models/user.js");

const addAddressController = async (request, response) => {
    const userId = request.user.id;
    const { addressDetails } = request.body;
    try {
        const addAddressUser = await UserModel.updateOne(
            { _id: userId },
            {
                $push: {
                    addresses: {
                        name: addressDetails.name,
                        mobileno: addressDetails.mobileno,
                        location: addressDetails.location,

                    },
                },
            }
        );
        if (!addAddressUser.modifiedCount) {
            return response.status(500).json({
                message: "Failed to add user's address",
                error: true,
                success: false,
            });
        }
        return response.json({
            message: "Address added successfully",
            error: false,
            success: true
        });

    } catch (error) {
        console.error("Error in add address controller:", error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

const deleteAddressController = async (request, response) => {
    try {
        const userId = request.user.id;
        const { addressId } = request.body;

        if (!addressId) {
            return response.status(400).json({ success: false, message: "Product ID is required." });
        }
        const ObjectId = mongoose.Types.ObjectId;
        const addressObjectId = new ObjectId(addressId);
        const result = await UserModel.findOneAndUpdate(
            { _id: userId }, 
            { $pull: { addresses: { _id: addressObjectId } } },
            { new: true } 
        );

        if (!result) {
            return response.status(404).json({ success: false, message: "User not found or product not in cart." });
        }

        return response.status(200).json({
            success: true,
            message: "Address deleted successfully.",
            data: result.addresses
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
    addAddressController,
    deleteAddressController,
};