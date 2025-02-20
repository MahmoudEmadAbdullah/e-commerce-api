const express = require('express');

const {
    getBrandValidator,
    createBrandValidator,
    updateBrandValidator,
    deleteBrandValidator
} = require('../validators/brandValidator');

const { 
    getBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand,
    uploadBrandImage,
    resizeImage
} = require('../services/brandService');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();


router
    .route('/')
    .get(getBrands)
    .post(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        uploadBrandImage,
        resizeImage,
        createBrandValidator,
        createBrand
    );

router
    .route('/:id')
    .get(
        getBrandValidator, 
        getBrand
    )
    .put(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        uploadBrandImage,
        resizeImage,
        updateBrandValidator, 
        updateBrand
    )
    .delete(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        deleteBrandValidator, 
        deleteBrand
    );


module.exports = router;