const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');

const CategoryModel = require('../../DB/models/categoryModel');
const factoryHandler = require('./handlersFactory');
const {uploadSingleImage} = require('../middlewares/uploadImage');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


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
    if (req.file) {
        const uniqueFilename = `category-${uuidv4()}-${Date.now()}`;

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file.buffer, 'categories', uniqueFilename);

        // Save image URL to db
        req.body.image = imageUrl;
    } 
    next();
});





