const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const asyncHandler = require('express-async-handler');

const { uploadMixOfImages } = require('../middlewares/uploadImage');
const factoryHandler = require('./handlersFactory');
const ProductModel = require('../../DB/models/productModel');



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
    //image processing for imageCover
    if(req.files?.imageCover) {
        const imageCoverName = `product-${uuidv4()}-${Date.now()}-cover.jpeg`;
        await sharp(req.files.imageCover[0].buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/products/${imageCoverName}`);

        // Save image into our db
        req.body.imageCover = imageCoverName;
    }
    //image processing for images
    if(req.files?.images) {
        req.body.images = [];
        await Promise.all(
            req.files.images.map(async (image, index) => {
                const imageName = `product-${uuidv4()}-${Date.now()}-${index + 1}.jpeg`;
                await sharp(image.buffer)
                    .resize(2000, 1333)
                    .toFormat('jpeg')
                    .jpeg({ quality: 95 })
                    .toFile(`uploads/products/${imageName}`); 
    
                // Save image into our db
                req.body.images.push(imageName);
            })
        );
    }
    next();
});




