const slugify = require('slugify');
const { check, body } = require('express-validator');
const validatorMiddelware = require('../middlewares/validatorMiddleware');
const CategoryModel = require('../../DB/models/categoryModel');
const SubCategoryModel = require("../../DB/models/subCategoryModel");


exports.getSubCategoryValidator = [
    check('id')
        .isMongoId().withMessage('Invalid SubCategory id format')
        .custom(async (subCategoryId) => {
            const subCategory = await SubCategoryModel.findById(subCategoryId);
            if(!subCategory) {
                throw new Error(`No subCategory for this Id: ${subCategoryId}`);
            }
            return true;
        }),
        
    validatorMiddelware,
];


exports.createSubCategoryValidator = [
    check('name')
        .notEmpty().withMessage('SubCategory required')
        .trim()
        .isLength({min: 2}).withMessage('Too Short SubCategory')
        .isLength({max: 25}).withMessage('Too long SubCategory')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    check('category')
        .notEmpty().withMessage('SubCategory must belong to category')
        .isMongoId().withMessage('Invalid Category id format')
        .custom(async(categoryId) => {
            const category = await CategoryModel.findById(categoryId);
            if(!category){
                throw new Error(`No category for this id: ${categoryId}`);
            }
            return true;
        }),
        
    validatorMiddelware,
];


exports.updateSubCategoryValidator = [
    check('id')
        .notEmpty().withMessage('Id required')
        .isMongoId().withMessage('Invalid SubCategory id format')
        .custom(async (subCategoryId) => {
            const subCategory = await SubCategoryModel.findById(subCategoryId);
            if(!subCategory) {
                throw new Error(`No subCategory for this Id: ${subCategoryId}`);
            }
            return true;
        }),
        
    body('name')
        .notEmpty().withMessage('SubCategory name required')
        .trim()
        .isLength({min: 2}).withMessage('Too short SubCategory')
        .isLength({max: 25}).withMessage('Too long SubCategory')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    check('category')
        .optional()
        .isMongoId().withMessage('Invalid Category id format')
        .custom(async(categoryId) => {
            const category = await CategoryModel.findById(categoryId);
            if(!category){
                throw new Error(`No category for this id: ${categoryId}`);
            }
            return true;
        }),
    
    validatorMiddelware,
];


exports.deleteSubCategoryValidator = [
    check('id')
        .notEmpty().withMessage('id required')
        .isMongoId().withMessage('Invalid SubCategory id format')
        .custom(async (subCategoryId) => {
            const subCategory = await SubCategoryModel.findById(subCategoryId);
            if(!subCategory) {
                throw new Error(`No subCategory for this Id: ${subCategoryId}`);
            }
            return true;
        }),
    
    validatorMiddelware,
];

