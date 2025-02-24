
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

const { assignIdsToBody  } = require('../middlewares/assignIdsToBody');
const { setFilterObject } = require('../middlewares/setFilterObject');
const routeProtector = require('../middlewares/routeProtector');

const router = express.Router({mergeParams: true});


router
    .route('/')
    .get(
        setFilterObject, 
        getSubCategories
    )
    .post(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        assignIdsToBody, 
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