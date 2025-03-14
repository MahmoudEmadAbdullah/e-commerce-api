const mongoose = require('mongoose');

//Create Schema
const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            required: [true, 'Product title is required'],
            minlength: [3, 'Too short product title'],
            maxlength: [100, 'Too long product title']
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true
        },
        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true,
            minlength: [20, 'Too short product description'],
            maxlength: [500, 'Too long product description']
        },
        quantity: {
            type: Number,
            required: [true, 'Product quantity is required'],
            min: [0, 'Quantity must be a positive number']
        },
        sold: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: true,
            trim: true,
            max: [1000000, 'Price must be less than or equal to 1,000,000'],
            min: [0, 'Price must be a positive number']
        },
        priceAfterDiscount: {
            type: Number,
        },
        colors: [String],
        images: [String],
        imageCover: {
            type: String,
            required: [true, 'Product image cover is required']
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: [true, 'Product must be belong to parent category']
        },
        subcategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'SubCategory'
            }
        ],
        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Brand'
        },
        ratingsAverage: {
            type: Number,
            min: [1, 'Rating must be above or equal 1.0'],
            max: [5, 'Rating must be blew or equal 5.0']
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
    }, 
    {
        timestamps: true,
        collection: 'products',
        //To enable virtual populate
        toObject: {virtuals: true},
        toJSON: {virtuals: true}
    }
);


// Mongoose query middleware
productSchema.pre(/^find/, function(next) {
    this.populate({path: 'category', select: 'name -_id'}) 
        .populate({path: 'brand', select: 'name-_id'})
        .populate({
            path: 'subcategories', 
            select: 'name -_id',
            options: {disableCategoryPopulation: true}
        }); 
        
    next();
});


//Virtual Populate
productSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'product'
});


//Create model
const ProductModel = mongoose.model('Product', productSchema);

module.exports = ProductModel;