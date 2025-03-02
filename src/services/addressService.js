const asyncHandler = require('express-async-handler');
const UserModel = require('../../DB/models/userModel');


/**
 * @desc      Add address to user addresses list
 * @route     POST /api/addresses
 * @access    private/protected/user
 */
exports.addAddressToAddressesList = asyncHandler(async (req, res) => {
    //  $addToSet => add address object to user addresses array if address  not exist
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: {addresses: req.body}
        },
        { new: true, runValidators: true }
    );
    res.status(200).json({
        status: 'success',
        message: 'Adress added successfully.',
        data: user.addresses
    });
});


/**
 * @desc      Remove address from user addresses list
 * @route     DELETE /api/addresses/:addressId
 * @access    private/protected/user
 */
exports.removeAddressFromAddressesList = asyncHandler(async (req, res) => {
    // $pull => remove address object from user addresses array if address exist
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            $pull: {addresses: { _id: req.params.addressId }}
        },
        { new: true, runValidators: true }
    );
    res.status(200).json({
        status: 'success',
        message: 'Address removed successfully from your addresses.',
        data: user.addresses
    });
});


/**
 * @desc      Get Logged-in User Addresses
 * @route     GET /api/addresses
 * @access    private/protected/user
 */
exports.getLoggedUserAddresses = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user._id)
        .populate('addresses');

    res.status(200).json({
        status: 'success',
        result: user.addresses.length,
        data: user.addresses
    });
});