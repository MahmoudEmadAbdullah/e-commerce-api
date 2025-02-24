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

const { setFilterObject } = require('../middlewares/setFilterObject');
const { assignIdsToBody } = require('../middlewares/assignIdsToBody');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router({ mergeParams: true });


router
    .route('/')
    .get(setFilterObject, getReviews)
    .post(
        routeProtector.protect, 
        routeProtector.allowedTo('user'),
        assignIdsToBody,
        createReviewValidator,
        createReview
    );

router
    .route('/:id')
    .get(getReviewValidator, getReview)
    .put(
        routeProtector.protect, 
        routeProtector.allowedTo('user'),
        assignIdsToBody,
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