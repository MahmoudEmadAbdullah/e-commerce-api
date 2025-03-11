const mongoose = require('mongoose');


// Create Schema
const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        cartItems: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: [1, 'Quantity cannot be less than 1']
                },
                price: {
                    type: Number,
                    required: true
                },
                color: {
                    type: String,
                    required: true
                },
            },
        ],
        totalCartPrice: {
            type: Number,
            default: 0
        },  
        totalPriceAfterDiscount: {
            type: Number,
            default: 0
        },
    }, 
    {timestamps: true}
);

// Calculate total order price automatically (with discount)



//Create model
const CartModel = mongoose.model('Cart', cartSchema);

module.exports = CartModel;