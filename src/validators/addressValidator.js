const { check, body } = require('express-validator');

const validatorMiddleware = require('../middlewares/validatorMiddleware');
const UserModel = require('../../DB/models/userModel');


exports.addAddressValidator = [
    check('alias')
        .notEmpty().withMessage('alisa required')
        .isLength({min: 4}).withMessage('Too short alias')
        .isLength({max: 20}).withMessage('Too long alias')
        .trim()
        .custom(async (alias, { req }) => {
            const isAddressExist = await UserModel.findOne({
                _id: req.user._id,
                addresses: {
                    $elemMatch: {
                        alias: alias,
                        detalis: req.body.detalis,
                        phone: req.body.phone,
                        city: req.body.city,
                        postalCode: req.body.postalCode
                    }
                }
            });
    
            if (isAddressExist) {
                throw new Error('This address already exists.');
            }
            return true;
        }),

    check('detalis')
        .notEmpty().withMessage('Address details required')
        .isLength({min: 10}).withMessage('Too short details')
        .isLength({max: 100}).withMessage('Too long details')
        .trim(),

    check('phone')
        .notEmpty().withMessage('Phone number required')
        .isMobilePhone(['ar-EG', 'ar-SA', 'ar-AE', 'en-US'])
        .withMessage('Please enter a valid mobile phone'),

    check('city')
        .notEmpty().withMessage('City required')
        .isLength({min: 4}).withMessage('Too short city name')
        .isLength({max: 20}).withMessage('Too long city name')
        .trim(),
    
    check('postalCode')
        .notEmpty().withMessage('postalCode required')
        .isPostalCode('any').withMessage('postalCode required'),

    validatorMiddleware,
];


exports.removeAddressValidators = [
    check('addressId')
        .notEmpty().withMessage('addressId required')
        .isMongoId().withMessage('Invalid addressId format'),

    validatorMiddleware,
];