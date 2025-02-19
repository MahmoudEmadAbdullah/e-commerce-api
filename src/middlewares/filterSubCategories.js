/**
 * @desc      Middleware to filter SubCategories by categoryId (if provided in the request params)
 * @route     GET /api/categories/:categoryId/subCategories
 */
exports.filterSubCategoriesByCategory = (req, res, next) => {
    let filterObject = {};
    if(req.params.categoryId) filterObject = { category: req.params.categoryId };
    req.filterObj = filterObject;
    next();
};