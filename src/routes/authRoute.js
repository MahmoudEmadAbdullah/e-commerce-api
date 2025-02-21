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
    forgotPassword,
    verifyPasswordResetCode,
    resetPassword
} = require('../services/authService')

const router = express.Router();


router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);
router.post('/forgotPassword', forgotPasswordValidator, forgotPassword);
router.post('/verifyResetCode', verifyPasswordResetCode);
router.put('/resetPassword', resetPasswordValidator, resetPassword);    

module.exports = router;