const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const CategoryModel = require('../../DB/models/categoryModel');
const SubCategoryModel = require("../../DB/models/subCategoryModel");
const BrandModel = require('../../DB/models/brandModel');
const mongoose = require('mongoose');

exports.getProductValidator = [
    check('id')
        .isMongoId().withMessage('Invalid product id format'),
    validatorMiddleware,
];


exports.createProductValidator = [
    check('title')
        .notEmpty().withMessage('Product title is required')
        .trim()
        .isLength({min: 3}).withMessage('must be at least 3 char')
        .isLength({max: 100}).withMessage('Too long product title')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    check('description')
        .notEmpty().withMessage('Product description is required')
        .trim()
        .isLength({min: 20}).withMessage('Too short product description')
        .isLength({max: 500}).withMessage('Too long product description'),

    check('quantity')
        .notEmpty().withMessage('Product quantity is required')
        .isInt({min: 0}).withMessage('Quantity must be a positive number'),

    check('sold')
        .optional()
        .isInt({min: 0}).withMessage('Sold must be a positive number'),

    check('price')
        .notEmpty().withMessage('Product price is rquired')
        .isFloat({min: 0, max: 1000000}).withMessage('Price must be between 0 and 1000000'),

    check('priceAfterDiscount')
        .optional()
        .isFloat({min: 0}).withMessage('Price after discount must be a positive number')
        .custom((val, {req}) => {
            if(val >= req.body.price) {
                throw new Error('Price after discount must be less than the original price')
            }
            return true;
        }),
    
    check('colors')
        .optional()
        .isArray().withMessage('Colors must be an array')
        .notEmpty().withMessage('Colors array should not be empty')
        .custom((colors) => {
            if(colors && !colors.every(color => typeof color === 'string')){
                throw new Error('Each color must be a string');
            }
            return true;
        }),

    check('images')
        .optional()
        .isArray().withMessage('Images must be an array')
        .notEmpty().withMessage('Images array should not be empty')
        .custom((images) => {
            if(images && !images.every(image => typeof image === 'string')){
                throw new Error('Each image must be a string');
            }
            return true;
        }),

    check('imageCover')
        .notEmpty().withMessage('Product image cover is required')
        .isString().withMessage('Product image cover must be a string'),
    
    check('category')
        .notEmpty().withMessage('Product must be belong to parent category')
        .isMongoId().withMessage('Invalid category Id format')
        .custom(async(categoryId) => {
            const category = await CategoryModel.findById(categoryId);
            if(!category){
                throw new Error(`No category for this Id: ${categoryId}`);
            }
            return true;
        }),

    check('subcategories')
        .optional()
        .customSanitizer(subCategoriesIds => {
            if(!subCategoriesIds) return [];
            return [...new Set(subCategoriesIds)];
        })
        .custom(async (subCategoriesIds, {req}) => {
            if(subCategoriesIds.length === 0) return true;

            const categoryId = req.body.category;
            const errors = [];

            await Promise.all(subCategoriesIds.map(async (subCategoryId) => {
                if(!mongoose.Types.ObjectId.isValid(subCategoryId)){
                    errors.push(`Invalid SubCategory Id format: ${subCategoryId}`);
                } else {
                    const subCategory = await SubCategoryModel.findById(subCategoryId);
                    if(!subCategory){
                        errors.push(`SubCategory not found: ${subCategoryId}`);
                    } else if (subCategory.category.toString() !== categoryId){
                        errors.push(`SubCategory ${subCategory.name} doesn't belong to category ${categoryId}`);
                    }
                }
            }));
            if(errors.length > 0) throw new Error(errors.join(', '));
            return true;
        }),

    check('brand')
        .optional()
        .isMongoId().withMessage('Invalid brand Id format')
        .custom(async(brandId) => {
            const brand = await BrandModel.findById(brandId);
            if(!brand){
                throw new Error(`No brand for this Id: ${brandId}`);
            }
            return true;
        }),

    check('ratingsAverage')
        .optional()
        .isFloat({min: 1, max: 5}).withMessage('Rating must be between 1.0 and 5.0'),

    check('ratingsQuantity')
        .optional()
        .isInt({min: 0}).withMessage('Ratings quantity must be a positive integer or zero'),
    
    validatorMiddleware,
]; 


exports.updateProductValidator = [
    check('id')
        .notEmpty().withMessage('product id is required')
        .isMongoId().withMessage('Invalid Product id format'),

    body('title')
        .optional()
        .trim()
        .isLength({min: 3}).withMessage('must be at least 3 char')
        .isLength({max: 100}).withMessage('Too long product title')
        .custom((val, {req}) => {
            if (val) { 
                req.body.slug = slugify(val, { lower: true });
            }
            return true;
        }),

    body('description')
        .optional()
        .trim()
        .isLength({min: 20}).withMessage('Too short product description')
        .isLength({max: 500}).withMessage('Too long product description'),

    body('quantity')
        .optional()
        .isInt({min: 0}).withMessage('Quantity must be a positive number'),

    body('sold')
        .optional()
        .isInt({min: 0}).withMessage('Sold must be a positive number'),

    body('price')
        .optional()
        .isFloat({min: 0, max: 1000000}).withMessage('Price must be between 0 and 1000000'),

    body('priceAfterDiscount')
        .optional()
        .isFloat({min: 0}).withMessage('Price after discount must be a positive number')
        .custom((val, { req }) => {
            if (req.body.price === undefined) {
                throw new Error('Price is required when updating priceAfterDiscount');
            }
            if (val >= req.body.price) {
                throw new Error('Price after discount must be less than the original price');
            }
            return true;
        }),

    body('colors')
        .optional()
        .isArray().withMessage('Colors must be an array')
        .notEmpty().withMessage('Colors array should not be empty')
        .custom((colors) => {
            if(colors && !colors.every(color => typeof color === 'string')){
                throw new Error('Each color must be a string');
            }
            return true;
        }),

    body('images')
        .optional()
        .isArray().withMessage('Images must be an array')
        .notEmpty().withMessage('Images array should not be empty')
        .custom((images) => {
            if(images && !images.every(image => typeof image === 'string')){
                throw new Error('Each image must be a string');
            }
            return true;
        }),

    body('imageCover')
        .optional()
        .isString().withMessage('Product image cover must be a string'),
    
    body('category')
        .optional()
        .isMongoId().withMessage('Invalid category Id format')
        .custom(async(categoryId) => {
            const category = await CategoryModel.findById(categoryId);
            if(!category){
                throw new Error(`No category for this Id: ${categoryId}`);
            }
            return true;
        }),

    body('subcategories')
        .optional()
        .customSanitizer(subCategoriesIds => {
            if(!subCategoriesIds) return [];
            return [...new Set(subCategoriesIds)];
        })
        .custom(async (subCategoriesIds, {req}) => {
            if(subCategoriesIds.length === 0) return true;

            const categoryId = req.body.category;
            const errors = [];

            await Promise.all(subCategoriesIds.map(async (subCategoryId) => {
                if(!mongoose.Types.ObjectId.isValid(subCategoryId)){
                    errors.push(`Invalid SubCategory Id format: ${subCategoryId}`);
                } else {
                    const subCategory = await SubCategoryModel.findById(subCategoryId);
                    if(!subCategory){
                        errors.push(`SubCategory not found: ${subCategoryId}`);
                    } else if (subCategory.category.toString() !== categoryId){
                        errors.push(`SubCategory ${subCategory.name} doesn't belong to category ${categoryId}`);
                    }
                }
            }));
            if(errors.length > 0) throw new Error(errors.join(', '));
            return true;
        }),

    body('brand')
        .optional()
        .isMongoId().withMessage('Invalid brand Id format')
        .custom(async(brandId) => {
            const brand = await BrandModel.findById(brandId);
            if(!brand){
                throw new Error(`No brand for this Id: ${brandId}`);
            }
            return true;
        }),

    body('ratingsAverage')
        .optional()
        .isFloat({min: 1, max: 5}).withMessage('Rating must be between 1.0 and 5.0'),

    body('ratingsQuantity')
        .optional()
        .isInt({min: 0}).withMessage('Ratings quantity must be a positive integer or zero'),
    
    validatorMiddleware,
];


exports.deleteProductValidator = [
    check('id')
        .notEmpty().withMessage('product id is required')
        .isMongoId().withMessage('Invalid Product id format'),
        
    validatorMiddleware,
];




