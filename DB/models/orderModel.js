const mongoose = require('mongoose');


//Create Schema
const orderSchema = new mongoose.Schema(
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
        shippingAddress: {
            details: String,
            city: String,
            phone: String,
            postalCode: String
        },
        taxprice: {
            type: Number,
            default: 0
        },
        shippingprice: {
            type: Number,
            default: 0
        },
        totalOrderPrice: {
            type: Number,
            default: 0
        },
        paymentMethodType: {
            type: String,
            enum: ['card', 'cash'],
            default: 'cash'
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        paidAt: Date,
        isDelivered: {
            type: Boolean,
            default: false
        },
        deliveredAt: Date,
    }, 
    {timestamps: true, collection: "orders"}
);

orderSchema.pre(/^find/, function(next) {
    this.populate({path: "user", select: "name"})
        .populate({path: 'cartItems.product', select: "title, imageCover" });

    next()
});

// Create model
const OrderModel = mongoose.model('Order', orderSchema);

module.exports = OrderModel;