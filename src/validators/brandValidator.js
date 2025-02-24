const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const BrandModel = require('../../DB/models/brandModel');


exports.getBrandValidator = [
    check('id')
        .isMongoId().withMessage('Invalid brand Id format')
        .custom(async (brandId) => {
            const brand = await BrandModel.findById(brandId);
            if(!brand) {
                throw new Error(`No brand for this Id: ${brandId}`);
            }
            return true;
        }),

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
        .isMongoId().withMessage('Invalid brand Id format')
        .custom(async (brandId) => {
            const brand = await BrandModel.findById(brandId);
            if(!brand) {
                throw new Error(`No brand for this Id: ${brandId}`);
            }
            return true;
        }),

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
        .isMongoId().withMessage('Invalid brand Id format')
        .custom(async (brandId) => {
            const brand = await BrandModel.findById(brandId);
            if(!brand) {
                throw new Error(`No brand for this Id: ${brandId}`);
            }
            return true;
        }),
        
    validatorMiddleware,
];