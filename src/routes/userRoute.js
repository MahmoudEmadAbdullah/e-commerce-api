const express = require('express');

const {
    getUserValidator,
    createUserValidator,
    updateUserValidator,
    deleteUserValidator,
    changeUserPasswordValidator
} = require('../validators/userValidator');

const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    uploadUserImage,
    resizeUserImage
} = require('../services/userService');

const routeProtector = require('../middlewares/routeProtector');
const router = express.Router();

router
    .route('/')
    .get(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        getUsers
    )
    .post(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        uploadUserImage,
        resizeUserImage,
        createUserValidator,
        createUser

    );

router
    .route('/:id')
    .get(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        getUser, 
        getUserValidator
    )
    .delete(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        deleteUser, 
        deleteUserValidator
    )
    .put(
        routeProtector.protect,
        routeProtector.allowedTo('admin'),
        uploadUserImage,
        resizeUserImage,
        updateUserValidator,
        updateUser

    );

router.put(
    '/changePassword/:id', 
    routeProtector.protect,
    changeUserPasswordValidator, 
    changeUserPassword
);

module.exports = router;