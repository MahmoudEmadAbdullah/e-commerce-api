const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');

const BrandModel = require('../../DB/models/brandModel');
const factoryHandler = require('./handlersFactory');
const {uploadSingleImage} = require('../middlewares/uploadImage');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


/**
 * @desc      Get all brands
 * @route     GET /api/brands
 * @access    public
 */
exports.getBrands = factoryHandler.getAllDocuments(BrandModel, 'brands', true);


/**
 * @desc      Get specific brand
 * @route     Get /api/brands/:id
 * @access    public
 */
exports.getBrand = factoryHandler.getDocument(BrandModel, undefined, true);


/**
 * @desc      Create  brand
 * @route     POST /api/brands
 * @access    private
 */
exports.createBrand = factoryHandler.createDocument(BrandModel, true);


/**
 * @desc      Update Specific brand
 * @route     PUT /api/brands/:id
 * @access    private
 */
exports.updateBrand = factoryHandler.updateDocument(BrandModel, true);


/**
 * @desc      Delete specific brand
 * @route     DELETE /api/brands/:id
 * @access    private
 */
exports.deleteBrand = factoryHandler.deleteDocument(BrandModel, true);


// Upload single image
exports.uploadBrandImage = uploadSingleImage('image');


// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
    if (req.file) {
        const uniqueFilename = `brand-${uuidv4()}-${Date.now()}`;

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file.buffer, 'brands', uniqueFilename);

        // Save image URL to db
        req.body.image = imageUrl;
    } 
    next();
});

