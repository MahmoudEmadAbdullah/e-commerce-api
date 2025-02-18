const express = require('express');

const {
    getUserValidator,
    createUserValidator,
    updateUserValidator,
    deleteUserValidator,
    updateUserPasswordValidator
} = require('../validators/userValidator');

const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateUserPassword,
    uploadUserImage,
    resizeUserImage
} = require('../services/userService');

const router = express.Router();

router
    .route('/')
    .get(getUsers)
    .post(

        uploadUserImage,
        resizeUserImage,
        createUserValidator,
        createUser

    );

router
    .route('/:id')
    .get(getUser, getUserValidator)
    .delete(deleteUser, deleteUserValidator)
    .put(

        uploadUserImage,
        resizeUserImage,
        updateUserValidator,
        updateUser

    );

router.put('/changePassword/:id', updateUserPasswordValidator, updateUserPassword);

module.exports = router;