const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');

const ApiError = require('../utils/apiError');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const hashEmailCode = require('../utils/hashEmailCode');
const { client } = require('../config/redisConfig');
const UserModel = require('../../DB/models/userModel');


/**
 * @desc      Signup new user
 * @route     POST /api/auth/signup
 * @access    public
 */
exports.signup = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;
    // 1- Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCode_hash = hashEmailCode(verificationCode);
    // 2- Create user
    const user = await UserModel.create(
        {
            name,
            email,
            password,
            emailVerificationCode: verificationCode_hash,
            verificationCodeExpires: Date.now() + 5 * 60 * 1000,
            emailVerified: false,
        }
    );

    // 3- Send verification email
    try {
        const message = sendEmail.verificationTemplate(user.name, verificationCode);
        await sendEmail({
            email: user.email,
            subject: 'Verify your email address',
            message,
        });
    } catch(error) {
        await UserModel.findByIdAndDelete(user._id);
        return next(new ApiError('Failed to send verification email', 500));
    }

    res.status(201).json({
        message: 'Verification code sent to your email. Please verify within 5 minutes.',
    });
});


/**
 * @desc      Verify user email
 * @route     POST /api/auth/verifyEmail
 * @access    public
 */
exports.verifyEmail = asyncHandler(async (req, res, next) => {
    // Get user bassed on verification code
    const verificationCode_hash = hashEmailCode(req.body.verificationCode);
    const user = await UserModel.findOne( 
        {
            emailVerificationCode: verificationCode_hash,
            verificationCodeExpires: { $gt: Date.now() }
        }
    );
    if(!user) {
        return next(new ApiError('Verification code invalid or expired', 400));
    }
    
    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({
        status: 'Success',
        message: 'Email verified successfully. Please log in to continue.'
    });
});


/**
 * @desc      Login user
 * @route     POST /api/auth/login
 * @access    public
 */
exports.login = asyncHandler(async (req, res, next) => {
    // 1- Verify the user
    const { email, password } = req.body;
    const user = await UserModel.findOne({email}).select('password email name');
    if(!user || !(await bcrypt.compare(password, user.password))){
        return next(new ApiError(`Invalid email or password`, 401));
    }

    // 2- Update last login time
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false});

    // 3- generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 4- Store Refresh Token in Cahe
    try {
        const refreshKey = `refreshToken:${user._id}`;
        await client.del(refreshKey);
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await client.set(refreshKey, hashedRefreshToken, {
            EX: 7 * 24 * 60 * 60,
        });
    } catch(error) {
        return next(new ApiError('Session initialization failed', 500));
    }

    // Send Cookie and response
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({
        accessToken,
        user: {id: user._id, name: user.name, email: user.email}
    });
});


/**
 * @desc      Refresh Access Token using Refresh Token
 * @route     POST /api/auth/refresh-token
 * @access    public
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
    const refreshToken = req.cookies?.refreshToken;
    if(!refreshToken) {
        return next(new ApiError('Refresh token is required', 401));
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Verify that the Refresh Token exists in Redis
    try {
        const refreshKey = `refreshToken:${decoded.userId}`;
        const storedHashedToken = await client.get(refreshKey);
        if(!storedHashedToken) {
            return next(new ApiError('Invalid or expired refresh token', 401));
        }
        const isMatch = await bcrypt.compare(refreshToken, storedHashedToken);
        if(!isMatch) {
            return next(new ApiError('Refresh token is required', 401));
        }
    
        // Generate a new Access Token
        const newAccessToken = generateAccessToken(decoded.userId)
    
        res.status(200).json({ accessToken: newAccessToken });
    } catch(error) {
        return next(new ApiError('Server error while validating refresh token', 500));
    }
});


/**
 * @desc      Logout user 
 * @route     POST /api/auth/logout
 * @access    private
 */
exports.logout = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;

    try {
        const refreshKey = `refreshToken:${userId}`;
        await client.del(refreshKey);
    } catch(error) {
        return next(new ApiError('Session initialization failed', 500));
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0
    });

    res.status(200).json({ message: 'Logged out successfully'});
});


/**
 * @desc      Forgot Password
 * @route     POST /api/auth/forgotPassword
 * @access    public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
    //1- Get user by email
    const user = await UserModel.findOne({email: req.body.email}).select('email name');
    if(!user) {
        return next(new ApiError(`There is no user with that email ${req.body.email}`, 404));
    }

    //2- if user exists, Generate hash random 6 digits and save it in db
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCode_hash = hashEmailCode(resetCode);
    //Save hashed reset code into db
    user.passwordResetCode = resetCode_hash;
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
    const resetCode_hash = hashEmailCode(req.body.resetCode);
    const user = await UserModel.findOne(
        { 
            passwordResetCode: resetCode_hash, 
            passwordResetExpires: {$gt: Date.now()},
        }
    ).select('passwordResetCode passwordResetExpires passwordResetVerified');

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
    const user = await UserModel.findOne({email: req.body.email})
        .select('email password passwordResetCode passwordResetExpires passwordResetVerified');
    if(!user) {
        return next(new ApiError(`There is no user for this email ${req.body.email}`, 400));
    }
    //2- Check if reset code verified 
    if(user.passwordResetVerified === false){
        return next(new ApiError('Reset code not verified', 400));
    }
    // 3- Update password and reset fields
    user.password = req.body.newPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save();

    // 4- Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 5- Store Refresh Token in Cahe
    try {
        const refreshKey = `refreshToken:${user._id}`;
        await client.del(refreshKey);
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        await client.set(refreshKey, hashedRefreshToken, {
            EX: 7 * 24 * 60 * 60,
        });
    } catch(error) {
        return next(new ApiError('Session initialization failed', 500));
    }

    // Send Cookie and response
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({ accessToken });
});