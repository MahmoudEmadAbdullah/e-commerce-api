const { check } = require('express-validator');

const ApiError = require('../utils/apiError');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const CartModel = require('../../DB/models/cartModel');
const OrderModel = require('../../DB/models/orderModel');

exports.creatCachOrderValidator = [
    check('cartId')
        .notEmpty().withMessage('cartId required')
        .trim()
        .isMongoId().withMessage('Invalid cartId format')
        .custom(async(cartId) => {
            const cart = await CartModel.findById(cartId);
            if(!cart) {
                throw new ApiError(`No cart for this Id: ${cartId}`);
            }
        }),

    check('taxprice')
        .optional()
        .isNumeric().withMessage('Tax price must be a number'),

    check('shippingprice')
        .optional()
        .isNumeric().withMessage('Shipping price must be a number'),

    validatorMiddleware,
];


exports.orderIdValidator = [
    check('orderId')
        .notEmpty().withMessage('orderId required')
        .trim()
        .isMongoId().withMessage('Invalid orderId format')
        .custom(async(orderId) => {
            const order = await OrderModel.findById(orderId);
            if(!order) {
                throw new ApiError(`No order for this Id: ${orderId}`);
            }
        }),

    validatorMiddleware,
];


