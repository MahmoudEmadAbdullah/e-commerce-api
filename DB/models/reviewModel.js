const mongoose = require('mongoose');
const ProductModel = require('../models/productModel');


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


// Mongoose query middleware
reviewSchema.pre(/^find/, function(next) {
    this.populate({path: 'user', select: 'name profileImag'});
    next();
});


// Calculate average ratings and update product stats using aggregation
reviewSchema.statics.clacAverageRatingsAndQuantity = async function(productId) {
    const result = await this.aggregate([
        //Stage 1 : get all reviews in specific product
        { $match: { product: productId } },
        //Stage 2 : grouping reviews based on productId and calculate avgRating and quantity
        {
            $group: {_id: '$product', avgRatings: {$avg: '$ratings'}, ratingsQuantity: {$sum: 1}}
        }
    ]);
    if(result.length > 0){
        await ProductModel.findByIdAndUpdate(
            productId,
            {
                ratingsAverage: result[0].avgRatings,
                ratingsQuantity: result[0].ratingsQuantity,
            }
        );
    } else {
        await ProductModel.findByIdAndUpdate(
            productId,
            {
                ratingsAverage: 0,
                ratingsQuantity: 0,
            }
        );
    }
}; 

// Trigger aggregation update after saving a new review     
reviewSchema.post('save', async function (){
    await this.constructor.clacAverageRatingsAndQuantity(this.product);
});

// Trigger aggregation update after deleting a review
reviewSchema.post(/deleteOne/, { document: true }, async function (){
    await this.constructor.clacAverageRatingsAndQuantity(this.product);
});


//Create model
const ReviewModel = mongoose.model('Review', reviewSchema);

module.exports = ReviewModel;