const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const hashResetCode = require('../utils/hashResetCode');

const UserModel = require('../../DB/models/userModel');



/**
 * @desc      Signup new user
 * @route     POST /api/auth/signup
 * @access    public
 */
exports.signup = asyncHandler(async (req, res) => {
    //1-Create user
    const user = await UserModel.create(
        {
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        }
    );
    //2-Generate token
    const token = generateToken(user._id);
    //send response
    res.status(201).json({data: user, token});
});


/**
 * @desc      Login user
 * @route     POST /api/auth/login
 * @access    public
 */
exports.login = asyncHandler(async (req, res, next) => {
    //1- check if email and password in the body (validation layer)
    //2- check if user exist and check if password is correct
    const user = await UserModel.findOne({email: req.body.email});
    if(!user || !(await bcrypt.compare(req.body.password, user.password))){
        return next(new ApiError(`Invalid email or password`, 401));
    }
    //3- generate token
    const token = generateToken(user._id);
    //send response
    res.status(200).json({data: user, token});
});


/**
 * @desc      Forgot Password
 * @route     POST /api/auth/forgotPassword
 * @access    public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    //1- Get user by email
    const user = await UserModel.findOne({email: req.body.email});
    if(!user) {
        return next(new ApiError(`There is no user with that email ${req.body.email}`, 404));
    }

    //2- if user exists, Generate hash random 6 digits and save it in db
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const ResetCode_hash = hashResetCode(resetCode);
    //Save hashed reset code into db
    user.passwordResetCode = ResetCode_hash;
    // Add expiration time for reset code (5 minutes)
    user.passwordResetExpires = Date.now() + 5 * 60 * 1000;
    user.passwordResetVerified = false;
    await user.save();

    //3- send reset code via email
    const message = sendEmail.resetPasswordTemplate(user.name, resetCode);
    try{
        await sendEmail({
            email: user.email,
            subject: 'Your password reset code (valid for 5 minutes)',
            message,
        });
    } catch(err) {
        // Clear reset code data from the user document if email sending fails
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetVerified = undefined;
        await user.save();
        return next(new ApiError('There is an error in sending email', 500));
    }

    //4- Send response
    res.status(200).json({status: 'Success', message: 'Reset code send to email'});
});


/**
 * @desc      Verify password reset code
 * @route     POST /api/auth/verifyResetCode
 * @access    public
 */
exports.verifyPasswordResetCode = asyncHandler(async (req, res, next) => {
    //1- Get user bassed on reset code
    const ResetCode_hash = hashResetCode(req.body.resetCode);
    const user = await UserModel.findOne(
        { 
            passwordResetCode: ResetCode_hash, 
            passwordResetExpires: {$gt: Date.now()},
        }
    );
    if(!user) {
        return next(new ApiError('Reset code invalid or expired', 400));
    }
    //2- Reset code valid
    user.passwordResetVerified = true;
    await user.save();

    res.status(200).json({status: 'Success'})
});


/**
 * @desc      Reser password
 * @route     PUT /api/auth/resetPassword
 * @access    public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
    //1- Get user based on email
    const user = await UserModel.findOne({email: req.body.email});
    if(!user) {
        return next(new ApiError(`There is no user for this email ${req.body.email}`, 400));
    }
    //2- Check if reset code verified 
    if(user.passwordResetVerified === false){
        return next(new ApiError('Reset code not verified', 400));
    }
    user.password = req.body.newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();

    //3- Generate new token
    const token = generateToken(user._id);

    res.status(200).json({token});
});