const mongoose = require('mongoose');

//Create Schema
const reviewSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
        },
        ratings: {
            type: Number,
            min: [1, 'Min ratings value is 1.0'],
            max: [5, 'Max ratings value is 5.0'],
            required: [true, 'Review ratings required']
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to user'],
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Review must belong to product']
        }
    }, 
    {timestamps: true}
);


//Create model
const ReviewModel = mongoose.model('Review', reviewSchema);

module.exports = ReviewModel;