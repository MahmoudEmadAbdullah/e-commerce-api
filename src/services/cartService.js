const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const CartModel = require('../../DB/models/cartModel');
const ProductModel = require('../../DB/models/productModel');
const CouponModel = require('../../DB/models/couponModel');
const { client } = require('../config/redisConfig');
const {
    getSessionId, 
    updateCartCache, 
    deleteCartCache,
} = require('../utils/cacheUtils');



/**
 * @desc      Add product to cart
 * @route     POST /api/cart
 * @access    private/user
 */
exports.addProductToCart = asyncHandler(async (req, res, next) => {
    const sessionId = getSessionId(req);

    const { productId, quantity, color } = req.body;
    // Get only the price of the product
    const product = await ProductModel.findById(productId).select('price');
    if(!product) {
        return next(new ApiError('No product found', 404));
    }
    // Check quantity
    if(quantity <= 0) {
        return next(new ApiError('Invalid quantity', 400));
    }

    const priceIncrease = product.price * quantity;
    // update quantity if product exists in cart
    const cart = await CartModel.findOneAndUpdate(
        {
            user: req.user._id,
            cartItems: { $elemMatch: { product: productId, color } }
        },
        {
            $inc: {
                'cartItems.$.quantity': quantity,
                totalCartPrice: priceIncrease
            }
        },
        { new: true, select: '-createdAt -__v'}
    );

    if(!cart) {
         // If product is not in the cart, add it
        const newCart = await CartModel.findOneAndUpdate(
            {user: req.user._id},
            {
                $addToSet: {
                    cartItems: { product: productId, price: product.price, quantity, color}
                },
                $inc: {
                    totalCartPrice: priceIncrease
                },
                // Ensures user is only set on insert, preventing accidental updates when using upsert.
                $setOnInsert: { user: req.user._id }
            },
            // upsert creates the cart if it does not exist.
            { new: true, upsert: true, select: '-createdAt -__v'},
        );

        // Update cache after add product to cart
        await updateCartCache(sessionId, newCart);

        return res.status(200).json({
            status: 'success',
            message: 'Product added to cart',
            data: newCart
        });
    }

    // Update cahe after the quantity updated
    await updateCartCache(sessionId, cart);

    res.status(200).json({
        status: 'success',
        message: 'Quantity updated',
        data: cart
    });
});



/**
 * @desc      Get logged-in user cart
 * @route     Get /api/cart
 * @access    private/user
 */
exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
    const sessionId = getSessionId(req);
    try {
        const cachedCart = await client.get(sessionId);
        if(cachedCart) {
            return res.status(200).json({
                source: 'Cache',
                numOfCartItem: JSON.parse(cachedCart).cartItems.length,
                data: JSON.parse(cachedCart),
            });
        }
    } catch (err) {
        console.error('Error fetching cart from cache:', err);
    }

    const cart = await CartModel.findOne({user: req.user._id});
    if(!cart) {
        return next(new ApiError(`No cart for this user Id: ${req.user._id}`, 404));
    }

    // Update cache
    await updateCartCache(sessionId, cart);

    res.status(200).json({
        source: 'database',
        numOfCartItem: cart.cartItems.length,
        data: cart
    });
});


/**
 * @desc      Remove product from cart 
 * @route     DELETE /api/cart/:itemId
 * @access    private/user
 */
exports.removeProductFromCart = asyncHandler(async (req, res, next) => {
    const sessionId = getSessionId(req);
    // Remove the product from the cart
    const cart = await CartModel.findOneAndUpdate(
        { user: req.user._id },
        {
            $pull: { cartItems: { _id: req.params.itemId } }
        },
        { new: true }
    );
    if(!cart) {
        return next(new ApiError(`Cart not found!`, 404));
    }
    // Recalculate the total price after removal
    cart.totalCartPrice = cart.cartItems.reduce((total, item) => {
        return total + (item.price * item.quantity)
    }, 0);
    await cart.save();

    // Delete cache after remove product 
    await deleteCartCache(sessionId);

    // Update cache 
    await updateCartCache(sessionId, cart);

    res.status(200).json({
        status: 'success',
        numOfCartItem: cart.cartItems.length,
        data: cart
    });
});


/**
 * @desc      Clear logged user cart
 * @route     DELETE /api/cart
 * @access    private/user
 */
exports.clearCart = asyncHandler(async (req, res) => {
    const sessionId = getSessionId(req);
    await CartModel.findOneAndDelete({ user: req.user._id });

    // Delete cahe after clear cart
    await deleteCartCache(sessionId);

    res.status(204).send();
});


/**
 * @desc      Update specific cart item quantity
 * @route     Put /api/cart/:itemId
 * @access    private/user
 */
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
    const sessionId = getSessionId(req);
    const { quantity } = req.body;
    const { itemId } = req.params;
    // Validate that the quantity is correct
    if(!quantity || quantity < 1) {
        return next(new ApiError('Invalid quantity. Must be at least 1.', 400));
    }
    // Update the product quantity in the cart
    const cart = await CartModel.findOneAndUpdate(
        {
            user: req.user._id,
            'cartItems._id': itemId
        },
        {
            $set: { 'cartItems.$.quantity': quantity }
        },
        { new: true }
    );

    if (!cart) {
        return next(new ApiError('Cart not found or item does not exist.', 404));
    }
    // Recalculate the total price after updating the quantity
    cart.totalCartPrice = cart.cartItems.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);

    await cart.save();

    // Delete cache after update quantity
    await deleteCartCache(sessionId);

    // Update cahe
    await updateCartCache(sessionId, cart);

    res.status(200).json({
        status: 'success',
        message: 'Cart item quantity updated successfully.',
        data: cart
    });
});


/**
 * @desc      Apply coupon to cart
 * @route     POST /api/cart/applyCoupon
 * @access    private/user
 */
exports.applyCoupon = asyncHandler(async (req, res, next) => {
    const sessionId = getSessionId(req);
    const { couponName } = req.body;
    // Checks if the cart exists
    const cart = await CartModel.findOne({ user: req.user._id });
    if(!cart) {
        return next(new ApiError(`No Cart for this user Id: ${req.user._id}`, 404));
    }

    //Validate Coupon
    const coupon = await CouponModel.findOne({
            name: couponName, 
            expire: { $gt: new Date() } 
        });
    if(!coupon) {
        return next(new ApiError('Invalid coupon code', 400));
    }

    // Calculates the new total price
    const discountAmount = (cart.totalCartPrice * coupon.discount) / 100;
    cart.totalPriceAfterDiscount = cart.totalCartPrice - discountAmount;

    await cart.save();

    // Delete cache after coupon applied
    await deleteCartCache(sessionId)

    // Update cache
    await updateCartCache(sessionId, cart);

    res.status(200).json({
        status: 'success',
        message: 'Coupon applied successfully.',
        totalCartPrice: cart.totalCartPrice,
        totalPriceAfterDiscount: cart.totalPriceAfterDiscount,
        data: cart
    });
});
