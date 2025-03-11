const express = require('express');

const {
    creatCachOrderValidator,
    orderIdValidator
} = require('../validators/orderValidator')

const {
    createCashOrder,
    getOrders,
    getOrder,
    updateOrderTopaid,
    updateOrderTDelivered
} = require('../services/orderService');

const routeProtector = require('../middlewares/routeProtector');
const rateLimiter = require('../middlewares/rateLimiter');
const { setFilterObject } = require('../middlewares/setFilterObject');
const router = express.Router();


router.use(routeProtector.protect);

router.post('/:cartId', 
    routeProtector.allowedTo('user'), 
    rateLimiter, 
    creatCachOrderValidator, 
    createCashOrder
);

router.put('/:orderId/pay', 
    routeProtector.allowedTo('admin'), 
    rateLimiter, orderIdValidator,
    updateOrderTopaid
);

router.put('/:orderId/deliver', 
    routeProtector.allowedTo('admin'), 
    rateLimiter, 
    orderIdValidator, 
    updateOrderTDelivered
);

router.use(routeProtector.allowedTo('admin', 'user'));
router.get('/', 
    rateLimiter, 
    setFilterObject, 
    getOrders
);

router.get('/:orderId', 
    rateLimiter, 
    orderIdValidator,
    getOrder
);

module.exports = router;