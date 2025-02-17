/**
 * @desc      Middleware to set categoryId in request body
 * @route     POST /api/categories/:categoryId/subCategories
 * @access    private
 * 
 * This middleware is used in routes where a subcategory is being created inside a specific category.
 * It automatically assigns `categoryId` from the request parameters to `req.body.category`
 * if it's not already provided in the request body. This ensures the subcategory is correctly
 * linked to its parent category.
 */
exports.assignCategoryIdToBody = (req, res, next) => {
    if(!req.body.category) req.body.category = req.params.categoryId;
    next();
};
