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

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();


router.use('/:categoryId/subCategories', subCategoryRoute);


router
    .route('/')
    .get(getCategories)
    .post(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        uploadCategoryImage, 
        resizeImage,
        createCategoryValidator, 
        createCategory
    );

    
router
    .route('/:id')
    .get(
        getCategoryValidator, 
        getCategory
    )
    .put(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        uploadCategoryImage, 
        resizeImage,
        updateCategoryValidator,
        updateCategory
    )
    .delete(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        deleteCategoryValidator, 
        deleteCategory
    );

module.exports = router;