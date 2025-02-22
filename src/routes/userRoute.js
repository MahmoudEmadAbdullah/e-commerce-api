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
const router = express.Router();


//Logged User
router.get('/getMe', routeProtector.protect, getLoggedUserData);

router.put(
    '/changeMyPassword', 
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

router.delete('/deactivateMe', routeProtector.protect, deactivateLoggedUser);
router.patch('/reactivateMe', routeProtector.protect, reactiveLoggedUser);

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
    .get(getUser, getUserValidator)
    .delete(deleteUser, deleteUserValidator)
    .put(
        uploadUserImage,
        resizeUserImage,
        updateUserValidator,
        updateUser

    );

router.put(
    '/changePassword/:id', 
    changeUserPasswordValidator, 
    changeUserPassword
);


module.exports = router;