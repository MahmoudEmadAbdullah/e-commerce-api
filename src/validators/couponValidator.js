const { check, body } = require('express-validator');

const ApiError = require('../utils/apiError');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const CouponModel = require('../../DB/models/couponModel');


exports.getCouponValidator = [
    check('id')
        .notEmpty().withMessage('Coupon Id required')
        .isMongoId().withMessage('Invalid coupon Id format')
        .custom(async (couponId, {req}) => {
            const coupon = await CouponModel.findById(couponId);
            if(!coupon){
                throw new ApiError(`No coupon found for this Id: ${couponId}`, 404);
            }
            return true;
        }),

    validatorMiddleware,
];


exports.createCouponValidator = [
    check('name')
        .notEmpty().withMessage('Coupon name required')
        .trim()
        .toUpperCase()
        .isLength({min: 3}).withMessage('Coupon name must be at least 3 characters')
        .isLength({max: 20}).withMessage('Coupon name must be at most 20 characters')
        .custom(async (name) => {
            const existingCoupon = await CouponModel.findOne({name});
            if(existingCoupon) {
                throw new ApiError('Coupon name already exists', 400);
            }
            return true;
        }),        

    check('expire')
        .notEmpty().withMessage('Coupon expire time required')
        .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD')
        .custom((value) => {
            if(new Date(value) < new Date()) {
                throw new ApiError('Expiration date must be in the future', 400);
            }
            return true;
        }),

    check('discount')
        .notEmpty().withMessage('Coupon discount required')
        .isFloat({min: 1, max: 100}).withMessage('Discount must be between 1 and 100'),

    validatorMiddleware,
];


exports.updateCouponValidator = [
    check('id')
        .notEmpty().withMessage('Coupon Id required')
        .isMongoId().withMessage('Invalid coupon Id format')
        .custom(async (couponId, {req}) => {
            const coupon = await CouponModel.findById(couponId);
            if(!coupon){
                throw new ApiError(`No coupon found for this Id: ${couponId}`, 404);
            }
            return true;
        }),

    body('name')
        .optional()
        .trim()
        .toUpperCase()
        .isLength({min: 3}).withMessage('Coupon name must be at least 3 characters')
        .isLength({max: 20}).withMessage('Coupon name must be at most 20 characters')
        .custom(async (name) => {
            const existingCoupon = await CouponModel.findOne({name});
            if(existingCoupon) {
                throw new ApiError('Coupon name already exists', 400);
            }
            return true;
        }),        

    body('expire')
        .optional()
        .isISO8601().withMessage('Invalid date format, use YYYY-MM-DD')
        .custom((value) => {
            if(new Date(value) < new Date()) {
                throw new ApiError('Expiration date must be in the future', 400);
            }
            return true;
        }),

    body('discount')
        .optional()
        .isFloat({min: 1, max: 100}).withMessage('Discount must be between 1 and 100'),

    validatorMiddleware,
];


exports.deleteCouponValidator = [
    check('id')
        .notEmpty().withMessage('Coupon Id required')
        .isMongoId().withMessage('Invalid coupon Id format')
        .custom(async (couponId, {req}) => {
            const coupon = await CouponModel.findById(couponId);
            if(!coupon){
                throw new ApiError(`No coupon found for this Id: ${couponId}`, 404);
            }
            return true;
        }),

    validatorMiddleware,
];


