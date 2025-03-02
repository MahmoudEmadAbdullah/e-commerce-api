const factoryHandler = require('./handlersFactory');
const CouponModel = require('../../DB/models/couponModel');


/**
 * @desc      Get all Coupons
 * @route     GET /api/coupons
 * @access    private/admin
 */
exports.getCoupons = factoryHandler.getAllDocuments(CouponModel);


/**
 * @desc      Get a specific Coupon
 * @route     GET /api/coupons/:id
 * @access    private/admin
 */
exports.getCoupon = factoryHandler.getDocument(CouponModel);


/**
 * @desc      Create coupon
 * @route     POST /api/coupons
 * @access    private/admin
 */
exports.createCoupon = factoryHandler.createDocument(CouponModel);


/**
 * @desc      Update specific coupon
 * @route     POST /api/coupons/:id
 * @access    private/admin
 */
exports.updateCoupon = factoryHandler.updateDocument(CouponModel);


/**
 * @desc      Delete specific coupon
 * @route     POST /api/coupons/:id
 * @access    private/admin
 */
exports.deleteCoupon = factoryHandler.deleteDocument(CouponModel);