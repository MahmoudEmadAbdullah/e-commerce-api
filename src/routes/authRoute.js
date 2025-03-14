const express = require('express');

const { 
    signupValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator
} = require('../validators/authValidator')

const { 
    signup,
    verifyEmail,
    login,
    refreshToken,
    logout,
    forgotPassword,
    verifyPasswordResetCode,
    resetPassword
} = require('../services/authService')

const routeProtector = require('../middlewares/routeProtector');
const rateLimiter = require('../middlewares/rateLimiter');
const router = express.Router();


router.post('/signup', rateLimiter, signupValidator, signup);
router.post('/verifyEmail', rateLimiter, verifyEmail);
router.post('/login', rateLimiter, loginValidator, login);
router.post('/forgotPassword', rateLimiter, forgotPasswordValidator, forgotPassword);
router.post('/verifyResetCode', verifyPasswordResetCode);
router.post('/refresh-token', rateLimiter, refreshToken);
router.post('/logout', routeProtector.protect, logout);
router.put('/resetPassword', rateLimiter, resetPasswordValidator, resetPassword);    

module.exports = router;