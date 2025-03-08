const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');

const CategoryModel = require('../../DB/models/categoryModel');
const factoryHandler = require('./handlersFactory');
const {uploadSingleImage} = require('../middlewares/uploadImage');



/** 
 * @desc     Get all categories
 * @route    GET  /api/categories
 * @access   public
 */
exports.getCategories = factoryHandler.getAllDocuments(CategoryModel, 'Categories', true);


/**
 * @desc     Get specific category by id
 * @route    GET  /api/categories/:id
 * @access   public
 */
exports.getCategory = factoryHandler.getDocument(CategoryModel, undefined, true);


/**
 * @desc    Create category
 * @route   POST  /api/categories
 * @access  private
 */
exports.createCategory = factoryHandler.createDocument(CategoryModel, true);


/** 
 * @desc     Update specific category by id
 * @route    PUT  /api/categories/:id
 * @access   private
 */
exports.updateCategory = factoryHandler.updateDocument(CategoryModel, true);


/**
 * @desc     Delete specific category by id
 * @route    DELETE  /api/categories/:id
 * @access   private
 */
exports.deleteCategory = factoryHandler.deleteDocument(CategoryModel, true);



// Upload single image
exports.uploadCategoryImage = uploadSingleImage('image');


// Image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
    const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;
    if (req.file) {
        await sharp(req.file.buffer)
            .resize(600, 600)
            .toFormat('jpeg')
            .jpeg({ quality: 95 })
            .toFile(`uploads/categories/${filename}`);

        // Save image into our db
        req.body.image = filename;
    }
    next();
});






