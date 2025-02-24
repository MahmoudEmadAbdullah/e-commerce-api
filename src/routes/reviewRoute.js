const express = require('express');

const {
    getReviewValidator,
    createReviewValidator,
    updateReviewValidator,
    deleteReviewValidator
} = require('../validators/reviewValidator');

const {
    getReviews,
    getReview,
    createReview,
    updateReview,
    deleteReview
} = require('../services/reviewService');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();


router
    .route('/')
    .get(getReviews)
    .post(
        routeProtector.protect, 
        routeProtector.allowedTo('user'),
        createReviewValidator,
        createReview
    );

router
    .route('/:id')
    .get(getReviewValidator, getReview)
    .put(
        routeProtector.protect, 
        routeProtector.allowedTo('user'),
        updateReviewValidator,
        updateReview
    )
    .delete(
        routeProtector.protect,
        routeProtector.allowedTo('user', 'admin'),
        deleteReviewValidator,
        deleteReview
    );

module.exports = router;