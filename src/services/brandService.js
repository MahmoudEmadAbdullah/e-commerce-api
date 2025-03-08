const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');

const BrandModel = require('../../DB/models/brandModel');
const factoryHandler = require('./handlersFactory');
const {uploadSingleImage} = require('../middlewares/uploadImage');



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
    const filename = `brand-${uuidv4()}-${Date.now()}.jpeg`;
    if (req.file) {
        await sharp(req.file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/brands/${filename}`);

        // Save image into our db
        req.body.image = filename;
    }
    next();
});

