const express = require('express');

const { 
    signupValidator,
    loginValidator
} = require('../validators/authValidator')

const { 
    signup,
    login
} = require('../services/authService')

const router = express.Router();


router
    .route('/signup')
    .post(signupValidator, signup);

router
    .route('/login')
    .post(loginValidator, login);

    
module.exports = router;