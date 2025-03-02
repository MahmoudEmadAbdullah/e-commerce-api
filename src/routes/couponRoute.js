const express = require('express');

const {
    getCouponValidator,
    createCouponValidator,
    updateCouponValidator,
    deleteCouponValidator
} = require('../validators/couponValidator')

const {
    getCoupon,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon
} = require('../services/couponService');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();


router.use(routeProtector.protect, routeProtector.allowedTo('admin'));

router
    .route('/')
    .get(getCoupons)
    .post(createCouponValidator, createCoupon);

router
    .route('/:id')
    .get(getCouponValidator, getCoupon)
    .put(updateCouponValidator, updateCoupon)
    .delete(deleteCouponValidator, deleteCoupon);

module.exports = router;