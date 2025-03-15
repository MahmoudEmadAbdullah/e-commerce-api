const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');

const { uploadMixOfImages } = require('../middlewares/uploadImage');
const factoryHandler = require('./handlersFactory');
const ProductModel = require('../../DB/models/productModel');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


/**
 * @desc      Get all products
 * @route     GET /api/products
 * @access    public
 */
exports.getProducts = factoryHandler.getAllDocuments(ProductModel, 'products', true);


/**
 * @desc      Get specific product by id
 * @route     GET /api/products/:id
 * @access    public
 */
exports.getProduct = factoryHandler.getDocument(ProductModel, 'reviews', true);


/**
 * @desc      Create product
 * @route     POST /api/products
 * @access    private
 */
exports.createProduct = factoryHandler.createDocument(ProductModel, true);


/**
 * @desc      Update specific product
 * @route     PUT /api/products/:id
 * @access    private
 */
exports.updateProduct = factoryHandler.updateDocument(ProductModel, true);


/**
 * @desc      Delete spesific product
 * @route     DELETE /api/products/:id
 * @access    private      
 */
exports.deleteProduct = factoryHandler.deleteDocument(ProductModel, true);


// Upload mix of image
exports.uploadProductImages = uploadMixOfImages(
    [
        {name: 'imageCover', maxCount: 1},
        {name: 'images', maxCount: 8}
    ]
);  

// Image processing
exports.resizeProductImages = asyncHandler(async (req, res, next) => {
    // Upload imageCover to Cloudinary
    if(req.files?.imageCover) {
        const imageCoverName = `product-${uuidv4()}-${Date.now()}-cover`;

        const uploadUrl = await uploadToCloudinary(
            req.files.imageCover[0].buffer,
            'products',
            imageCoverName
        );

        req.body.imageCover = uploadUrl
    }
    // Upload multiple images to Cloudinary
    if(req.files?.images) {
        req.body.images = await Promise.all(
            req.files.images.map(async (image, index) => {
                const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}`;
                const uploadUrl = await uploadToCloudinary(
                    image.buffer,
                    'products',
                    imageName
                );
                return uploadUrl

            })
        );
    }
    next();
});




