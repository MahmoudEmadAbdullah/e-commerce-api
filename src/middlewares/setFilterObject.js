/**
 * @desc       Middleware to set filter object based on parent ID (e.g., categoryId, productI
 * @route     GET /api/categories/:categoryId/subCategories ||  GET /api/products/:productId/reviews
 */
exports.setFilterObject = (req, res, next) => {
    let filterObject = {};
    if(req.params.categoryId) filterObject = { category: req.params.categoryId };
    if(req.params.productId) filterObject = { product: req.params.productId};
    req.filterObj = filterObject;
    next();
};

