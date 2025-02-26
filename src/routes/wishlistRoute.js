const express = require('express');

const {
    WishlistValidator
} = require('../validators/wishlistValidator');

const {
    addProductToWishlist,
    removeProductFromWishlist,
    getLoggedUserWishlist
} = require('../services/wishlistService');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();


router.use(routeProtector.protect, routeProtector.allowedTo('user'));

router
    .route('/')
    .get(getLoggedUserWishlist)
    .post(WishlistValidator,addProductToWishlist);

router
    .route('/:productId')
    .delete(WishlistValidator, removeProductFromWishlist);


module.exports = router;