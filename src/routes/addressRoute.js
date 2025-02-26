const express = require('express');

const {
    addAddressValidator,
    removeAddressValidators
} = require('../validators/addressValidator');

const {
    addAddressToAddressesList,
    removeAddressFromAddressesList,
    getLoggedUserAddresses
} = require('../services/addressService');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();


router.use(routeProtector.protect, routeProtector.allowedTo('user'));

router
    .route('/')
    .get(getLoggedUserAddresses)
    .post(addAddressValidator, addAddressToAddressesList);

router
    .route('/:addressId')
    .delete(removeAddressValidators, removeAddressFromAddressesList);

module.exports = router;