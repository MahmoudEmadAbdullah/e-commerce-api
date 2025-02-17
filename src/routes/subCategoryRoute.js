
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
const router = express.Router({mergeParams: true});


router
    .route('/')
    .get(filterSubCategoriesByCategory, getSubCategories)
    .post(assignCategoryIdToBody, createSubCategoryValidator, createSubCategory);

router
    .route('/:id')
    .get(getSubCategoryValidator, getSubCategory)
    .put(updateSubCategoryValidator, updatesubCategory)
    .delete(deleteSubCategoryValidator, deleteSubCategory);


module.exports = router;