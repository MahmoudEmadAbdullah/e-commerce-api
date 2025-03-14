const slugify = require('slugify');
const { check } = require('express-validator');

const ApiError = require('../utils/apiError');
const UserModel = require('../../DB/models/userModel');
const validatorMiddleware = require('../middlewares/validatorMiddleware');


exports.signupValidator = [
    check('name')
        .notEmpty().withMessage('Please Enter Your Name!')
        .trim()
        .isLength({min: 3}).withMessage('Too short user name')
        .isLength({max: 20}).withMessage('Too long user name')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),
    
    check('email')
        .notEmpty().withMessage('Please Enter Your Email!')
        .trim()
        .normalizeEmail()
        .isEmail().withMessage('Please enter a valid email address')
        .custom(async(userEmail) => {
            const user = await UserModel.findOne({email: userEmail});
            if(user) {
                throw new ApiError(`Email already exists. Please try another one: ${userEmail}`, 400)
            }
            return true;
        }),

    check('password')
        .notEmpty().withMessage('password is required')
        .isLength({min: 8}).withMessage('Too short password')
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'),
        
    check('passwordConfirm')
        .notEmpty().withMessage('passwordConfirm required')
        .custom((confirmPassword, {req}) => {
            if(req.body.password && confirmPassword !== req.body.password) {
                throw new ApiError('Password confirmation does not match password', 400);
            }
            return true;
        }),

    validatorMiddleware,
]; 


exports.loginValidator = [
    check('email')
        .notEmpty().withMessage('Please Enter Your Email!')
        .trim()
        .normalizeEmail()
        .isEmail().withMessage('Please enter a valid email address'),

    check('password')
        .notEmpty().withMessage('password is required')
        .isLength({min: 8}).withMessage('Too short password'),
        
    validatorMiddleware,
];


exports.forgotPasswordValidator = [
    check('email')
        .notEmpty().withMessage('Please Enter Your Email!')
        .trim()
        .normalizeEmail()
        .isEmail().withMessage('Please enter a valid email address'),

    validatorMiddleware,
];


exports.resetPasswordValidator = [
    check('email')
        .notEmpty().withMessage('Please Enter Your Email!')
        .trim()
        .normalizeEmail()
        .isEmail().withMessage('Please enter a valid email address'),
    
    check('newPassword')
        .notEmpty().withMessage('password is required')
        .isLength({min: 8}).withMessage('Too short password')
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'),
                
    check('newPasswordConfirm')
        .notEmpty().withMessage('passwordConfirm required')
        .custom((confirmPassword, {req}) => {
            if(req.body.newPassword && confirmPassword !== req.body.newPassword) {
                throw new ApiError('Password confirmation does not match password', 400);
            }
            return true;
        }),

    validatorMiddleware,
];
