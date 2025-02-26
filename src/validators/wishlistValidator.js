const { check, body } = require('express-validator');

const validatorMiddleware = require('../middlewares/validatorMiddleware');
const ProductModel = require('../../DB/models/productModel');

exports.WishlistValidator = [
    check('productId')
        .notEmpty().withMessage('productId required')
        .isMongoId().withMessage('Invalid productId format')
        .custom(async (productId) => {
            const product = await ProductModel.findById(productId);
            if(!product){
                throw new Error(`No product for this Id: ${productId}`);
            }
            return true;
        }),

    validatorMiddleware,
];

