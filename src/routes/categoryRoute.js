const express = require('express');

const { 
    getCategoryValidator,
    createCategoryValidator,
    updateCategoryValidator,
    deleteCategoryValidator 
} = require('../validators/categoryValidator');

const {
    getCategories, 
    getCategory, 
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    resizeImage
} = require('../services/categoryService');

const subCategoryRoute = require('./subCategoryRoute');

const router = express.Router();


router.use('/:categoryId/subCategories', subCategoryRoute);


router
    .route('/')
    .get(getCategories)
    .post(
        uploadCategoryImage, 
        resizeImage,
        createCategoryValidator, 
        createCategory
    );

    
router
    .route('/:id')
    .get(getCategoryValidator, getCategory)
    .put(
        uploadCategoryImage, 
        resizeImage,
        updateCategoryValidator,
        updateCategory
    )
    .delete(deleteCategoryValidator, deleteCategory);

module.exports = router;