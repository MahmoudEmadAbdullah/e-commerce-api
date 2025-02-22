const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const factoryHandler = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const UserModel = require('../../DB/models/userModel');
const generateToken = require('../utils/generateToken');
const { uploadSingleImage } = require('../middlewares/uploadImage');


/**
 * @desc      Get list of users
 * @route     GET /api/users
 * @access    private
 */
exports.getUsers = factoryHandler.getAllDocuments(UserModel);


/**
 * @desc      Get specific user by Id
 * @route     GET /api/users/:id
 * @access    private
 */
exports.getUser = factoryHandler.getDocument(UserModel);


/**
 * @desc      Create user
 * @route     POST /api/users
 * @access    private
 */
exports.createUser = factoryHandler.createDocument(UserModel);


/**
 * @desc      Delete specific user
 * @route     DELETE /api/users/:id
 * @access    private
 */
exports.deleteUser = factoryHandler.deleteDocument(UserModel);


/**
 * @desc      Update specific user data except for the password
 * @route     PUT /api/users/:id
 * @access    private
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
    res.status(200).json({data: user});
});


/**
 * @desc      Update specific user password
 * @route     PUT /api/users/changePassword/:id
 * @access    private
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
 * @access    private
 */
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findById(req.user._id)
        .select('-password');
    res.status(200).json({data: user});
});


/**
 * @desc      Update logged user password
 * @route     PUT /api/users/changeMyPassword
 * @access    private
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
    );
    const token = generateToken(user._id);
    res.status(200).json({status: 'Success', token});
});


/**
 * @desc      Update logged user data (without password)
 * @route     PUT /api/users/updateMe
 * @access    private
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
    );
    res.status(200).json({data: user});
});


/**
 * @desc      Deactivate logged-in user's account
 * @route     Delete /api/users/deactivateMe
 * @access    private
 */
exports.deactivateLoggedUser  = asyncHandler(async (req, res) => {
    await UserModel.findByIdAndUpdate(req.user._id, { active: false });
    res.status(200).json({
        status: 'Success',
        message: 'Your account has been deactivated.'
    });
});


/**
 * @desc      Reactivate logged-in user's account
 * @route     PATCH /api/users/reactivateMe
 * @access    Private
 */
exports.reactiveLoggedUser = asyncHandler(async (req, res, next) => {
    const user = await UserModel.findByIdAndUpdate(
        req.user._id,
        { active: true },
        {new: true}
    ).select('-password');

    res.status(200).json({
        status: 'success',
        message: 'Your account has been reactivated.',
        data: user
    });
});

//Upload single image
exports.uploadUserImage = uploadSingleImage('profileImage');

//Image processing
exports.resizeUserImage = asyncHandler(async (req, res, next) => {
    const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;
    if(req.file) {
        await sharp(req.file.buffer)
            .resize(600, 600)
            .toFormat('jpeg')
            .jpeg({quality: 95})
            .toFile(`uploads/users/${filename}`);

        // Save image into our db
        req.body.profileImage = filename;
    }
    next();
});