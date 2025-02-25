/**
 * @desc      Middleware to set categoryId and productId in request body
 * @route     POST /api/categories/:categoryId/subCategories
 * @route     POST /api/products/:productId/reviews
 * @access    private
 * 
 * This middleware is used in routes where a subcategory or review is being created inside 
 * a specific category or product. It automatically assigns `categoryId` and `productId` 
 * from the request parameters to `req.body.category` and `req.body.product` respectively,
 * if they are not already provided in the request body. This ensures proper linkage 
 * between subcategories, products, and their parents.
 */
exports.assignIdsToBody = (req, res, next) => {
    if(!req.body.category) req.body.category = req.params.categoryId;
    if(!req.body.product) req.body.product = req.params.productId;
    if(!req.body.user) req.body.user = req.user._id.toString();
    next();
};
