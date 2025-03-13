const stripe = require('stripe')(process.env.STRIPE_SECRET);
const asyncHandler = require('express-async-handler');

const factoryHandler = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { getSessionId, deleteCartCache, deleteCacheKeys } = require('../utils/cacheUtils');
const CartModel = require('../../DB/models/cartModel');
const ProductModel = require('../../DB/models/productModel');
const OrderModel = require('../../DB/models/orderModel');
const { default: mongoose } = require('mongoose');


/**
 * @desc      Create cash order
 * @route     POST /api/orders/:cartId
 * @access    private/protect/user
 */
exports.createCashOrder = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1- Get cart depend on cartId
        const { cartId } = req.params;
        const cart = await CartModel.findById(cartId).session(session);
        if(!cart) {
            await session.abortTransaction();
            return next(new ApiError(`No cart for this Id: ${cartId}`, 404));
        }
        // 2- Validate stock availability for each product
        for(const item of cart.cartItems) {
            const product = await ProductModel.findById(item.product).session(session);
            if(!product || product.quantity < item.quantity) {
                await session.abortTransaction();
                const errorMessage = product 
                    ? `Not enough stock for ${product.name}. Available: ${product.quantity}`
                    : 'Product not found';
                return next(new ApiError(errorMessage, 400));
            }
        }

        // 3- Get order price depend on cart price "check if coupon applied"
        let taxprice = 0; 
        let shippingprice = 0; 
        const cartPrice = cart.totalPriceAfterDiscount || cart.totalCartPrice;
        const totalOrderPrice = cartPrice + taxprice + shippingprice;

        // 4- Create order with default paymentMethodType cash
        const order = await OrderModel.create([{
            user: req.user._id,
            cartItems: cart.cartItems,
            taxprice,
            shippingprice,
            shippingAddress: req.body.shippingAddress,
            totalOrderPrice,
            paymentMethodType: 'cash'
        }], {session});

        // 5- decrement product quantity, Increment product sold.
        if(order) {
            const bulkOption = cart.cartItems.map((item) => ({
                updateOne: {
                    filter: { _id: item.product },
                    update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
                }
            }));
            await ProductModel.bulkWrite(bulkOption, {session});
        }

        // 6- Commit the transaction if all steps succeeded
        await session.commitTransaction();

        // 7- Delete product from cahce
        try {
            await Promise.all(
                cart.cartItems.map(async (item) => {
                    const productKeyPattern = `doc:${ProductModel.collection.name}:${item.product.toString()}:*`
                    await deleteCacheKeys(productKeyPattern);
                })  
            );
        } catch(error) {
            console.error(`Failed to delete product cache: ${error.message}`);
        }

        // 8- Delete cart from cache
        try{
            const sessionId = getSessionId(req);
            await deleteCartCache(sessionId);
        } catch(error) {
            console.error(`Failed to delete cart cache: ${error.message}`);
        }

        // 9- Clear cart depend on cardId
        await CartModel.findByIdAndDelete(cartId);

        res.status(201).json({status: 'Success', data: order[0]});
    } catch(error) {
        if(session.inTransaction()) {
            await session.abortTransaction();
        }
        next(new ApiError('Order creation failed', 500));
    } finally {
        session.endSession(); // End the session after transaction
    }
});


/**
 * @desc      Get all orders
 * @route     GET /api/orders
 * @access    private/protect/user - admin
 */
exports.getOrders = factoryHandler.getAllDocuments(OrderModel);


/**
 * @desc      Get a specific order
 * @route     GET /api/orders/:orderId
 * @access    private/protect/user - admin
 */
exports.getOrder = asyncHandler(async (req, res, next) => {
    const { orderId } = req.params;

    const filter = req.user.role === 'admin'
        ? { _id: orderId }
        : { _id: orderId, user: req.user._id }

    const order = await OrderModel.findOne(filter);

    if(!order) {
        return next(new ApiError(`No order for this Id: ${orderId}`, 404));
    }

    res.status(200).json({status: "Success", data: order });
});


/**
 * @desc      Update order paid status to paid
 * @route     Put /api/orders/:orderId/pay
 * @access    private/protect/admin
 */
exports.updateOrderTopaid = asyncHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const order = await OrderModel.findById(orderId);
    if(!order) {
        return next(new ApiError(`No order for this Id: ${orderId}`, 404));
    }

    order.isPaid = true;
    order.paidAt = Date.now();

    await order.save()

    res.status(200).json({status: "Success", data: order});
});


/**
 * @desc      Update order deliverd status 
 * @route     Put /api/orders/:orderId/deliver
 * @access    private/protect/admin
 */
exports.updateOrderTDelivered = asyncHandler(async (req, res, next) => {
    const { orderId } = req.params;
    const order = await OrderModel.findById(orderId);
    if(!order) {
        return next(new ApiError(`No order for this Id: ${orderId}`, 404));
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();

    await order.save()

    res.status(200).json({status: "Success", data: order});
});



/**
 * @desc      Get Checkout session from stripe and send it as response 
 * @route     GET /api/orders/checkout-session
 * @access    private/protect/user
 */
exports.checkoutSession = asyncHandler(async (req, res, next) => {
    // 1- Get cart depend on loged user
    const cart = await CartModel.findOne({ user: req.user._id });
    if(!cart) {
        return next(new ApiError(`Cart not found`, 404));
    }

    // 2- Validate stock availability for each product
    for(item of cart.cartItems) {
        const product = await ProductModel.findById(item.product);
        if(!product || product.quantity < item.quantity) {
            const errorMessage = product 
                ? `Not enough stock for ${product.name}. Available: ${product.quantity}`
                : 'Product not found';
            return next(new ApiError(errorMessage, 400));
        }
    }

    // 3- Get order price depend on cart price "check if coupon applied"
    let taxprice = 0;
    let shippingprice = 0;
    const cartPrice = cart.totalPriceAfterDiscount || cart.totalCartPrice;
    const totalOrderPrice = cartPrice + taxprice + shippingprice;

    // 4- create stripe checkout session
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: 'egp',
                    product_data: {
                        name: `Order from ${req.user.name}`,
                    },
                    unit_amount: totalOrderPrice * 100,
                },
                quantity: 1
            }
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/api/orders`,
        cancel_url: `${req.protocol}://${req.get('host')}/api/cart`,
        customer_email: req.user.email,
        client_reference_id: cart._id.toString(),
        metadata: {
            userId: req.user._id.toString(),
            shippingAddress: JSON.stringify(req.body.shippingAddress)
        }
    });

    // 5- Send session to response
    res.status(200).json({status: 'Success', session});
});


/**
 * @desc      Function to create online order
 */
const createOnlineOrder = asyncHandler(async (session) => {
    const userId = session.metadata.userId;
    const cartId = session.client_reference_id;
    const orderPrice = session.amount_total / 100;
    const shippingAddress = JSON.parse(session.metadata.shippingAddress);

    const cart = await CartModel.findById(cartId);

    const order = await OrderModel.create({
        user: userId,
        cartItems: cart.cartItems,
        shippingAddress,
        totalOrderPrice: orderPrice,
        isPaid: true,
        paidAt: Date.now(),
        paymentMethodType: 'card',
    });

    if(order) {
        const bulkOption = cart.cartItems.map((item) => ({
            updateOne: {
                filter: { _id: item.product },
                update: { $inc: { quantity: -item.quantity, sold: +item.quantity } }
            }
        }));
        await ProductModel.bulkWrite(bulkOption, {});
    }

    // Delete product from cahce
    try {
        await Promise.all(
            cart.cartItems.map(async (item) => {
                const productKeyPattern = `doc:${ProductModel.collection.name}:${item.product.toString()}:*`
                await deleteCacheKeys(productKeyPattern);
            })  
        );
    } catch(error) {
        console.error(`Failed to delete product cache: ${error.message}`);
    }

    // Delete cart from cache
    try{
        const cacheKey = `cart:${userId}`;
        await deleteCartCache(cacheKey);
    } catch(error) {
        console.error(`Failed to delete cart cache: ${error.message}`);
    }

    await CartModel.findByIdAndDelete(cartId);
});


/**
 * @desc      Handle Stripe webhook for checkout session completion
 * @route     POST /webhook-checkout
 * @access    public
 */
exports.webhookCheckout = asyncHandler(async (req, res, next) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch(err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if(event.type === 'checkout.session.completed') {
        createOnlineOrder(event.data.object);
    }

    res.status(200).json({ received: true });
});

