const mongoose = require('mongoose');


// Create Schema
const couponSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Coupon name required'],
            trim: true,
            unique: true,
            minlength: [3, "Coupon name must be at least 3 characters"],
            maxlength: [20, "Coupon name must be at most 20 characters"],
            uppercase: true
        },
        expire: {
            type: Date,
            required: [true, 'Coupon expire time required']
        },
        discount: {
            type: Number,
            required: [true, 'Coupon discount required']
        },
    }, 
    {timestamps: true}
);


// Create model
const CouponModel = mongoose.model('Coupon', couponSchema);

module.exports = CouponModel;