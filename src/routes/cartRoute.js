const express = require('express');

const {
    addProductToCartValidator,
    removeProductFromCartValidator,
    updateCartItemQuantityValidator,
    applyCouponValidator
} = require('../validators/cartValidator');

const {
    getLoggedUserCart,
    addProductToCart,
    removeProductFromCart,
    clearCart,
    updateCartItemQuantity,
    applyCoupon
} = require('../services/cartService');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();


router.use(routeProtector.protect, routeProtector.allowedTo('user'));

router
    .route('/')
    .get(getLoggedUserCart)
    .post(addProductToCartValidator, addProductToCart)
    .delete(clearCart);

router
    .route('/:itemId')
    .put(updateCartItemQuantityValidator, updateCartItemQuantity)
    .delete(removeProductFromCartValidator, removeProductFromCart);

router.post('/applyCoupon', applyCouponValidator, applyCoupon);

module.exports = router;