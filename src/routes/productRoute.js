const express = require('express');

const{
    getProductValidator,
    createProductValidator,
    updateProductValidator,
    deleteProductValidator
} = require('../validators/productValidator')

const{
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImages,
    resizeProductImages
} = require('../services/productService');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();


router
    .route('/')
    .get(getProducts)
    .post(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        uploadProductImages,
        resizeProductImages,
        createProductValidator, 
        createProduct
    );

router
    .route('/:id')
    .get(
        getProductValidator, 
        getProduct
    )
    .put(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        uploadProductImages,
        resizeProductImages,
        updateProductValidator, 
        updateProduct
    )
    .delete(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        deleteProductValidator, 
        deleteProduct
    );

    
module.exports = router;