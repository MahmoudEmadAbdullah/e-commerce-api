const { check, body } = require('express-validator');

const validatorMiddleware = require('../middlewares/validatorMiddleware');
const UserModel = require('../../DB/models/userModel');
const ProductModel = require('../../DB/models/productModel');
const ReviewModel = require('../../DB/models/reviewModel');


exports.getReviewValidator = [
    check('id')
        .isMongoId().withMessage('Invalid review Id format')
        .custom(async (reviewId) => {
            const review = await ReviewModel.findById(reviewId);
            if(!review){
                throw new Error(`No review for this Id: ${review}`);
            }
            return true;
        }),
    
    validatorMiddleware,
];


exports.createReviewValidator = [
    check('title')
        .optional()
        .trim()
        .isLength({min: 4}).withMessage('Too short review')
        .isLength({max: 150}).withMessage('Too long review'),

    check('ratings')
        .notEmpty().withMessage('Review ratings required')
        .isFloat({min: 1, max: 5}).withMessage('ratings must be between 1.0 and 5.0'),

    check('user')
        .notEmpty().withMessage('Review must belong to user')
        .isMongoId().withMessage('Invalid user Id format')
        .custom(async (userId, {req}) => {
            const user = await UserModel.findById(userId);
            if(!user){
                throw new Error(`No user for this Id: ${userId}`);
            }
            //Check if user has already reviewed the product
            const {product} = req.body;
            const existingReview = await ReviewModel.findOne({user: userId, product});
            if(existingReview) {
                throw new Error('You have already reviewed this product');
            }
            return true;
        }),

    check('product')
        .notEmpty().withMessage('Review must belong to product')
        .isMongoId().withMessage('Invalid product Id format')
        .custom(async (productId) => {
            const product = await ProductModel.findById(productId);
            if(!product) {
                throw new Error(`No product for this Id: ${productId}`);
            }
        }),

    validatorMiddleware,
];


exports.updateReviewValidator = [
    check('id')
        .notEmpty().withMessage('Review must belong to user')
        .isMongoId().withMessage('Invalid user Id format')
        .custom(async (reviewId, {req}) => {
            const review = await ReviewModel.findById(reviewId);
            if(!review){
                throw new Error(`No review for this Id: ${review}`);
            }
            // Ensure that only the review creator can update it
            if(review.user._id.toString() !== req.user._id.toString()) {
                throw new Error('You are not allowed to perform this action');
            }
            return true;
        }),

    body('title')
        .optional()
        .trim()
        .isLength({min: 4}).withMessage('Too short review')
        .isLength({max: 150}).withMessage('Too long review'),

    body('ratings')
        .optional()
        .isFloat({min: 1, max: 5}).withMessage('ratings must be between 1.0 and 5.0'),

    validatorMiddleware,
];


exports.deleteReviewValidator = [
    check('id')
        .notEmpty().withMessage('Review must belong to user')
        .isMongoId().withMessage('Invalid user Id format')
        .custom(async (reviewId, {req}) => {
            const review = await ReviewModel.findById(reviewId);
            if(!review){
                throw new Error(`No review for this Id: ${review}`);
            }
            if(req.user.role === 'user') {
                // Ensure that only the review creator can update it
                if(review.user.toString() !== req.user._id.toString()) {
                    throw new Error('You are not allowed to perform this action');
                }
            }
            return true;
        }),
    
    validatorMiddleware,
];