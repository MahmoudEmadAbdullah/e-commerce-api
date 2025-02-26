const asyncHandler = require('express-async-handler');
const UserModel = require('../../DB/models/userModel');


/**
 * @desc      Add Product to wishlist
 * @route     POST /api/wishlist
 * @access    private/protected/user
 */
exports.addProductToWishlist = asyncHandler(async (req, res) => {
    //  $addToSet => add productId to wishlist array if productId not exist
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            $addToSet: {wishlist: req.body.productId},
        },
        { new: true, runValidators: true}
    );
    res.status(200).json({
        status: 'success',
        message: 'Product added successfully to your wishlist.',
        data: user.wishlist
    });
});


/**
 * @desc      Remove Product from wishlist
 * @route     DELETE /api/wishlist/:productId
 * @access    private/protected/user
 */
exports.removeProductFromWishlist = asyncHandler(async (req, res) => {
    //  $pull => remove productId from wishlist array if productId exist
    const user = await UserModel.findByIdAndUpdate(
        req.user._id, 
        {
            $pull: {wishlist: req.params.productId}
        },
        { new: true, runValidators: true }
    );
    res.status(200).json({
        status: 'success',
        message: 'Product removed successfully from your wishlist.',
        data: user.wishlist
    });
});


/**
 * @desc      Get logged-in user wishlist
 * @route     GET /api/wishlist
 * @access    private/protected/user
 */
exports.getLoggedUserWishlist = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findById(req.user._id)
        .populate('wishlist');

    res.status(200).json({
        status: 'success',
        result: user.wishlist.length,
        data: user.wishlist,
    });
});