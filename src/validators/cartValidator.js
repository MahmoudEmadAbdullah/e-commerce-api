const { check, body } = require('express-validator');

const ApiError = require('../utils/apiError');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const ProductModel = require('../../DB/models/productModel');
const CartModel = require('../../DB/models/cartModel');
const CouponModel = require('../../DB/models/couponModel');


exports.addProductToCartValidator = [
    check('productId')
        .notEmpty().withMessage('productId required')
        .isMongoId().withMessage('Invalid productId format')
        .custom(async (productId, {req}) =>{
            const product = await ProductModel.findById(productId);
            if(!product) {
                throw new ApiError(`No product found for this Id: ${productId}`, 404);
            }
            req.product = product;
            return true;
        }),

    check('quantity')
        .notEmpty().withMessage('quantity required')
        .isInt({min: 1}).withMessage('Quantity cannot be less than 1')
        .custom(async (quantity, {req}) => {
            if(req.product) {
                // Find the current user's cart
                const cart = await CartModel.findOne({user: req.user._id});
                let totalQuantity = quantity;
                if(cart){
                   // If the product exists in the cart, calculate the total quantity
                    const cartItem = cart.cartItems.find(item => 
                        item.product.toString() === req.product._id.toString() &&
                        item.color === req.body.color.toLowerCase()
                    );
                    if(cartItem) {
                        totalQuantity += cartItem.quantity;
                    }
                }
                //Ensure the total quantity does not exceed the stock
                if(totalQuantity > req.product.quantity){
                    throw new ApiError(`Only ${req.product.quantity} items are available`, 400);
                }
            }
            return true;
        }),


    check('color')
        .notEmpty().withMessage('color required')
        .trim()
        .toLowerCase()
        .custom(async (color, {req}) => {
            if(req.product && !req.product.colors.includes(color)){
                throw new ApiError(`Invalid color choice. Available colors: ${req.product.colors.join(', ')}`, 400);
            }
            return true
        }),

    validatorMiddleware,
];


exports.removeProductFromCartValidator = [
    check('itemId')
        .notEmpty().withMessage('itemId required')
        .isMongoId().withMessage('Invalid itemId format')
        .custom(async (itemId, {req}) => {
            const cart = await CartModel.findOne({user: req.user._id});
            if(!cart){
                throw new ApiError('Cart not found.', 404);
            }
            const cartItem = cart.cartItems.find(item => item._id.toString() === itemId);
            if(!cartItem){
                throw new ApiError(`No cartItem for this Id: ${itemId}`, 404);
            }
            return true;
        }),

    validatorMiddleware,
];


exports.updateCartItemQuantityValidator = [
    check('itemId')
        .notEmpty().withMessage('itemId required')
        .isMongoId().withMessage('Invalid itemId format')
        .custom(async (itemId, {req}) => {
            const cart = await CartModel.findOne({user: req.user._id});
            if(!cart){
                throw new ApiError('Cart not found.', 404);
            }
            const cartItem = cart.cartItems.find(item => item._id.toString() === itemId);
            if(!cartItem){
                throw new ApiError(`No cartItem for this Id: ${itemId}`, 404);
            }
            req.cartItem = cartItem;
            return true;
        }),

    body('quantity')
        .notEmpty().withMessage('product quantity required')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1')
        .custom(async (quantity, {req}) => {
            const product = await ProductModel.findById(req.cartItem.product);
            if(!product) {
                throw new ApiError(`No product found for this Id: ${req.cartItem.product}`, 404)
            }
            if(quantity > product.quantity) {
                throw new ApiError(`Only ${product.quantity} items are available`, 400);
            }
            return true;
        }),

    validatorMiddleware,
];


exports.applyCouponValidator = [
    check('couponName')
        .notEmpty().withMessage('couponName required')
        .toUpperCase()
        .custom(async (couponName) => {
            const coupon = await CouponModel.findOne({name: couponName});
            if(!coupon){
                throw new ApiError('Invalid coupon code', 400);
            }
            if(coupon.expire < new Date()){
                throw new ApiError('Coupon has expired', 400);
            }
            return true;
        }),

    validatorMiddleware,
];