const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddelware = require('../middlewares/validatorMiddleware');


exports.getCategoryValidator = [
    check('id')
        .isMongoId().withMessage('Invalid category id format'),

    validatorMiddelware,
];


exports.createCategoryValidator = [
    check('name')
        .notEmpty().withMessage('Category required')
        .trim()
        .isLength({min: 3}).withMessage('Too short category name')
        .isLength({max: 25}).withMessage('Too long category')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    validatorMiddelware,
];


exports.updateCategoryValidator = [
    check('id')
        .notEmpty().withMessage('id required')
        .isMongoId().withMessage('Invalid category id format'),

    body('name')
        .optional()
        .trim()
        .isLength({min: 3}).withMessage('Too short category name')
        .isLength({max: 25}).withMessage('Too long category')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    validatorMiddelware,
];


exports.deleteCategoryValidator = [
    check('id')
        .notEmpty().withMessage('id required')
        .isMongoId().withMessage('Invalid category id format'),
        
    validatorMiddelware,
];