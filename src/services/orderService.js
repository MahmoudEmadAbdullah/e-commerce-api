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
 * @route     POST /api/orders/cartId
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
        const { taxprice=0, shippingprice=0, shippingAddress } = req.body;
        const cartPrice = cart.totalPriceAfterDiscount || cart.totalCartPrice;
        const totalOrderPrice = cartPrice + taxprice + shippingprice;

        // 4- Create order with default paymentMethodType cash
        const order = await OrderModel.create([{
            user: req.user._id,
            cartItems: cart.cartItems,
            taxprice,
            shippingprice,
            shippingAddress,
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