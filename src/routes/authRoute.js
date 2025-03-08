const express = require('express');

const { 
    signupValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator
} = require('../validators/authValidator')

const { 
    signup,
    login,
    refreshToken,
    logout,
    forgotPassword,
    verifyPasswordResetCode,
    resetPassword
} = require('../services/authService')

const router = express.Router();
const routeProtector = require('../middlewares/routeProtector');


router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);
router.post('/forgotPassword', forgotPasswordValidator, forgotPassword);
router.post('/verifyResetCode', verifyPasswordResetCode);
router.post('/refresh-token', refreshToken);
router.post('/logout', routeProtector.protect, logout);
router.put('/resetPassword', resetPasswordValidator, resetPassword);    

module.exports = router;