const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');


exports.getBrandValidator = [
    check('id')
        .isMongoId().withMessage('Invalid brand Id format'),

    validatorMiddleware,
];


exports.createBrandValidator = [
    check('name')
        .notEmpty().withMessage('Brand required')
        .isLength({min: 2}).withMessage('Too short brand')
        .isLength({max: 25}).withMessage('Too long brand')
        .trim()
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    validatorMiddleware,
];


exports.updateBrandValidator = [
    check('id')
        .notEmpty().withMessage('id required')
        .isMongoId().withMessage('Invalid brand Id format'),

    body('name')
        .optional()
        .trim()
        .isLength({min: 2}).withMessage('Too short brand')
        .isLength({max: 25}).withMessage('Too long brand')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    validatorMiddleware,
];


exports.deleteBrandValidator = [
    check('id')
        .notEmpty().withMessage('id required')
        .isMongoId().withMessage('Invalid brand Id format'),
        
    validatorMiddleware,
];