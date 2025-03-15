const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const factoryHandler = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const { deleteCacheKeys } = require('../utils/cacheUtils');
const UserModel = require('../../DB/models/userModel');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { uploadSingleImage } = require('../middlewares/uploadImage');
const { client } = require('../config/redisConfig');
const uploadToCloudinary = require('../utils/uploadToCloudinary');


/**
 * @desc      Get list of users
 * @route     GET /api/users
 * @access    private/admin
 */
exports.getUsers = factoryHandler.getAllDocuments(UserModel, 'users', true);


/**
 * @desc      Get specific user by Id
 * @route     GET /api/users/:id
 * @access    private/admin
 */
exports.getUser = factoryHandler.getDocument(UserModel, undefined, true);


/**
 * @desc      Create user
 * @route     POST /api/users
 * @access    private/admin
 */
exports.createUser = factoryHandler.createDocument(UserModel, true);


/**
 * @desc      Delete specific user
 * @route     DELETE /api/users/:id
 * @access    private/admin
 */
exports.deleteUser = factoryHandler.deleteDocument(UserModel, true);


/**
 * @desc      Update specific user data except for the password
 * @route     PUT /api/users/:id
 * @access    private/admin
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const user = await UserModel.findByIdAndUpdate(
        id ,
        {
            name: req.body.name,
            slug: req.body.slug,
            email: req.body.email,
            phone: req.body.phone,
            profileImage: req.body.profileImage,
            role: req.body.role
        },
        {new: true, runValidators: true}
    );
    if(!user) {
        return next(new ApiError(`No user for this Id: ${id}`, 404));
    }

    setImmediate(async () => {
        try {
            const userCachePattern = `doc:${UserModel.collection.name}:${id}:*`;
            await deleteCacheKeys(userCachePattern);

            const usersCachePattern = `docs:${UserModel.collection.name}:*`;
            await deleteCacheKeys(usersCachePattern);

        } catch(cacheError) {
            console.error('Cache Deletion Error:', cacheError);
        }
    });

    res.status(200).json({data: user});
});


/**
 * @desc      Update specific user password
 * @route     PUT /api/users/changePassword/:id
 * @access    private/admin
 */
exports.changeUserPassword = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    //Hashing password
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = await UserModel.findByIdAndUpdate(
        id ,
        {
            password: hashedPassword,
            passwordChangedAt: Date.now()
        },
        {new: true, runValidators: true}
    );
    if(!user) {
        return next(new ApiError(`No user for this Id: ${id}`, 404));
    }
    res.status(200).json({data: user});
});


/**
 * @desc      Get logged user data
 * @route     GET /api/users/getMe
 * @access    private/protect/user
 */
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
    const userCacheKey = `user:${req.user._id}`;
    try {
        const cachedData = await client.get(userCacheKey);
        if(cachedData) {
            return res.status(200).json({source: 'Cache', data: JSON.parse(cachedData) });
        }
    } catch(cacheError) {
        console.error('Cache Retrieval Error:', cacheError);
    }

    const user = await UserModel.findById(req.user._id).select('name email phone');

    try {
        await client.set(userCacheKey, JSON.stringify(user), { EX: 60 * 15 });
    } catch(cacheError) {
        console.error('Cache Saving Error:', cacheError);
    }

    res.status(200).json({source: 'database', data: user});
});


/**
 * @desc      Update logged user password
 * @route     PUT /api/users/changeMyPassword
 * @access    private/protect/user
 */
exports.changeLoggedUserPassword = asyncHandler(async (req, res) => {
    //Hashing password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            password: hashedPassword,
            passwordChangedAt: Date.now(),
        },
        {new: true, runValidators: true}
    ).select('_id');
    // Generate new tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    try {
        // Delete old refresh token from Redis if exists
        const oldRefreshTokenKey = `refreshToken:${user._id}`;
        await client.del(oldRefreshTokenKey);

        // Delete cached logged user data
        const userCacheKey = `user:${user._id}`;
        await client.del(userCacheKey);

        // Store new refresh token in Redis
        await client.set(oldRefreshTokenKey, refreshToken, { EX: 7 * 24 * 60 * 60 });
    } catch(redisError) {
        console.error('Redis Error:', redisError);
    }

    // Set refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 1000,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(200).json({status: 'Success', accessToken});
});


/**
 * @desc      Update logged user data (without password)
 * @route     PUT /api/users/updateMe
 * @access    private/protect/user
 */
exports.updateLoggedUserData = asyncHandler(async (req, res) => {
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            profileImage: req.body.profileImage
        },
        {new: true, runValidators: true}
    ).select('name email phone profileImage');

    setImmediate(async () => {
        try {
            const userCacheKey = `user:${user._id}`;
            await client.del(userCacheKey);
        } catch(cacheError) {
            console.error('Cache Deletion Error:', cacheError);
        }
    });

    res.status(200).json({data: user});
});


/**
 * @desc      Deactivate logged-in user's account
 * @route     Delete /api/users/deactivateMe
 * @access    private/protect/user
 */
exports.deactivateLoggedUser  = asyncHandler(async (req, res) => {
    await UserModel.findByIdAndUpdate(req.user._id, { active: false }).select('_id');

    try {
        // Delete logged user data from cache
        const userCacheKey = `user:${req.user._id}`;
        await client.del(userCacheKey);

        // Delete refresh token from cache
        const refreshTokenKey = `refreshToken:${req.user._id}`;
        await client.del(refreshTokenKey);
    } catch(redisError) {
        console.error('Redis Error:', redisError);
    }

    // Remove refresh token from cookie
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 0
    });

    res.status(200).json({
        status: 'Success',
        message: 'Your account has been deactivated.'
    });
});


/**
 * @desc      Reactivate logged-in user's account
 * @route     PATCH /api/users/reactivateMe
 * @access    private/protect/user
 */
exports.reactiveLoggedUser = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { active: true },
        {new: true}
    ).select('name email phone');

    try {
        const userCacheKey = `user:${req.user._id}`;
        await client.set(userCacheKey, JSON.stringify(user), { EX: 15 * 60 });
    } catch(cacheError) {
        console.error('Cache Saving Error:', cacheError);
    }

    res.status(200).json({
        status: 'success',
        message: 'Your account has been reactivated.',
        data: user
    });
});


//Upload single image
exports.uploadUserImage = uploadSingleImage('profileImage');


// Image processing
exports.resizeUserImage = asyncHandler(async (req, res, next) => {
    if (req.file) {
        const uniqueFilename = `user-${uuidv4()}-${Date.now()}`;

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file.buffer, 'users', uniqueFilename);

        // Save image URL to db
        req.body.profileImage = imageUrl;
    } 
    next();
});
