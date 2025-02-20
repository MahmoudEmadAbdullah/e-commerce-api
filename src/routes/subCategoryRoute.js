
const express = require('express');

const {
    getSubCategoryValidator,
    createSubCategoryValidator,
    updateSubCategoryValidator,
    deleteSubCategoryValidator
} = require('../validators/subCategoryValidator');

const {
    getSubCategories,
    getSubCategory,
    createSubCategory,
    updatesubCategory,
    deleteSubCategory,
} = require('../services/subCategoryService');

const {assignCategoryIdToBody } = require('../middlewares/assignCategoryId');
const { filterSubCategoriesByCategory } = require('../middlewares/filterSubCategories');
const routeProtector = require('../middlewares/routeProtector');

const router = express.Router({mergeParams: true});


router
    .route('/')
    .get(
        filterSubCategoriesByCategory, 
        getSubCategories
    )
    .post(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        assignCategoryIdToBody, 
        createSubCategoryValidator, 
        createSubCategory
    );

router
    .route('/:id')
    .get(
        getSubCategoryValidator, 
        getSubCategory
    )
    .put(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        updateSubCategoryValidator, 
        updatesubCategory
    )
    .delete(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        deleteSubCategoryValidator, 
        deleteSubCategory
    );


module.exports = router;