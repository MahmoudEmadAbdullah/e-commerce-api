const { check } = require('express-validator');

const ApiError = require('../utils/apiError');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const ProductModel = require('../../DB/models/productModel');

exports.WishlistValidator = [
    check('productId')
        .notEmpty().withMessage('productId required')
        .isMongoId().withMessage('Invalid productId format')
        .custom(async (productId) => {
            const product = await ProductModel.findById(productId);
            if(!product){
                throw new ApiError(`No product for this Id: ${productId}`, 404);
            }
            return true;
        }),

    validatorMiddleware,
];

