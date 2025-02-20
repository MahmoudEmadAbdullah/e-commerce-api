const slugify = require('slugify');
const bcrypt = require('bcrypt');
const { check, body } = require('express-validator');

const validatorMiddleware = require('../middlewares/validatorMiddleware');
const UserModel = require('../../DB/models/userModel');


exports.getUserValidator = [
    check('id')
        .isMongoId().withMessage('Invalid user Id format'),
    
    validatorMiddleware,
];


exports.createUserValidator = [
    check('name')
        .notEmpty().withMessage('User name is required')
        .trim()
        .isLength({min: 3}).withMessage('Too short user name')
        .isLength({max: 20}).withMessage('Too long user name')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    check('email')
        .notEmpty().withMessage('email is required')
        .trim()
        .normalizeEmail()
        .isEmail().withMessage('Please enter a valid email address')
        .custom(async(userEmail) => {
            const user = await UserModel.findOne({email: userEmail});
            if(user) {
                throw new Error(`Email already exists: ${userEmail}`)
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
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),
    
    check('phone')
        .optional()
        .trim()
        .isMobilePhone(['ar-EG', 'ar-SA', 'ar-AE', 'en-US'])
        .withMessage('Please enter a valid mobile phone'),

    check('profileImage')
        .optional()
        .isString().withMessage('Profile image must be string'),
    
    check('role')
        .optional()
        .isIn(['user', 'admin']).withMessage('Role must be either "user" or "admin"'),

    validatorMiddleware,
];


exports.updateUserValidator = [
    check('id')
        .notEmpty().withMessage('User Id required')
        .isMongoId().withMessage('Invalid user Id format'),

    body('name')
        .optional()
        .trim()
        .isLength({min: 3}).withMessage('Too short user name')
        .isLength({max: 20}).withMessage('Too long user name')
        .custom((val, {req}) => {
            req.body.slug = slugify(val, {lower: true});
            return true;
        }),

    body('email')
        .optional()
        .trim()
        .normalizeEmail()
        .isEmail().withMessage('Please enter a valid email address')
        .custom(async(userEmail) => {
            const user = await UserModel.findOne({email: userEmail});
            if(user && user.id !== req.params.id) {
                throw new Error(`Email already exists: ${userEmail}`)
            }
            return true;
        }),

    body('phone')
        .optional()
        .trim()
        .isMobilePhone(['ar-EG', 'ar-SA', 'ar-AE', 'en-US'])
        .withMessage('Please enter a valid mobile phone'),

    body('profileImage')
        .optional()
        .isString().withMessage('Profile image must be string'),

    body('role')
        .optional()
        .isIn(['user', 'admin']).withMessage('Role must be either "user" or "admin"'),

    validatorMiddleware,
];


exports.changeUserPasswordValidator = [
    check('id')
        .notEmpty().withMessage('User Id required')
        .isMongoId().withMessage('Invalid user Id format'),

    body('currentPassword')
        .notEmpty().withMessage('You must enter your current password')
        .custom(async (currentPassword, {req}) => {
            const user = await UserModel.findById(req.params.id);
            if(!user) {
                throw new Error(`No user for this Id: ${req.params.id}`);
            }
            const isCorrectPassword = await bcrypt.compare(req.body.currentPassword, user.password);
            if(!isCorrectPassword) {
                throw new Error('Incorrect current password');
            }
            return true;
        }),

    body('password')
        .notEmpty()
        .isLength({min: 8}).withMessage('Too short password')
        .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character'),
        
    body('passwordConfirm')
        .notEmpty().withMessage('You must enter the password confirm')
        .custom((confirmPassword, {req}) => {
            if(req.body.password && confirmPassword !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        }),

    validatorMiddleware,    
];


exports.deleteUserValidator = [
    check('id')
        .notEmpty().withMessage('User Id required')
        .isMongoId().withMessage('Invalid user Id format'),

    validatorMiddleware,
];



