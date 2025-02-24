const factoryHandler = require('./handlersFactory');
const ReviewModel = require('../../DB/models/reviewModel');

/**
 * @desc      Get all reviews
 * @route     GET /api/reviews
 * @access    public
 */
exports.getReviews = factoryHandler.getAllDocuments(ReviewModel);


/**
 * @desc      Get specific review
 * @route     GET /api/reviews/:id
 * @access    public
 */
exports.getReview = factoryHandler.getDocument(ReviewModel);


/**
 * @desc      Create a review
 * @route     POST /api/reviews
 * @access    private/protect/user
 */
exports.createReview = factoryHandler.createDocument(ReviewModel);


/**
 * @desc      Update Specific review
 * @route     PUT /api/reviews/:id
 * @access    private/protect/user
 */
exports.updateReview = factoryHandler.updateDocument(ReviewModel);


/**
 * @desc      Delete specific review
 * @route     DELETE /api/reviews/:id
 * @access    private/protect/user-admin
 */
exports.deleteReview = factoryHandler.deleteDocument(ReviewModel);