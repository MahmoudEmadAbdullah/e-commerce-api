const express = require('express');

const {
    getUserValidator,
    createUserValidator,
    updateUserValidator,
    deleteUserValidator,
    changeUserPasswordValidator,
    changeLoggedUserPasswordValidator,
    updateLoggedUserValidator
} = require('../validators/userValidator');

const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    getLoggedUserData,
    changeLoggedUserPassword,
    updateLoggedUserData,
    deactivateLoggedUser,
    reactiveLoggedUser,
    uploadUserImage,
    resizeUserImage
} = require('../services/userService');

const routeProtector = require('../middlewares/routeProtector');
const rateLimiter = require('../middlewares/rateLimiter');
const router = express.Router();


//Logged User
router.get('/getMe', routeProtector.protect, getLoggedUserData);

router.put(
    '/changeMyPassword', 
    rateLimiter,
    routeProtector.protect, 
    changeLoggedUserPasswordValidator, 
    changeLoggedUserPassword
);

router.put(
    '/updateMe', 
    routeProtector.protect, 
    uploadUserImage,
    resizeUserImage,
    updateLoggedUserValidator, 
    updateLoggedUserData
);

router.delete('/deactivateMe', rateLimiter, routeProtector.protect, deactivateLoggedUser);
router.patch('/reactivateMe', rateLimiter, routeProtector.protect, reactiveLoggedUser);

//Admin Only
router.use(routeProtector.protect, routeProtector.allowedTo('admin'));

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
    .get(getUserValidator, getUser)
    .delete(deleteUserValidator, deleteUser)
    .put(
        uploadUserImage,
        resizeUserImage,
        updateUserValidator,
        updateUser
    );

router.put(
    '/changePassword/:id', 
    rateLimiter,
    changeUserPasswordValidator, 
    changeUserPassword
);


module.exports = router;