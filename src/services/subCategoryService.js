const SubCategoryModel = require("../../DB/models/subCategoryModel");
const factoryHandler = require('./handlersFactory');


/**
 * @desc      Get all SubCategories
 * @route     GET /api/subCategories
 * @access    public
 */
exports.getSubCategories = factoryHandler.getAllDocuments(SubCategoryModel);


/**
 * @desc      Get specific SubCategory
 * @route     GET /api/subCategories/:id
 * @access    public
 */
exports.getSubCategory = factoryHandler.getDocument(SubCategoryModel);


/**
 * @desc      Create SubCategory
 * @route     POST /api/subCategories
 * @access    private
 */
exports.createSubCategory = factoryHandler.createDocument(SubCategoryModel);


/**
 * @desc      Update specific SubCategory
 * @route     PUT /api/subCategories/:id
 * @access    private
 */
exports.updatesubCategory = factoryHandler.updateDocument(SubCategoryModel);


/**
 * @desc      Delete specific SubCategory
 * @route     DELETE /api/subCategories/:id
 * @access    private
 */
exports.deleteSubCategory = factoryHandler.deleteDocument(SubCategoryModel);