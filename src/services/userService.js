const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');

const factoryHandler = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const UserModel = require('../../DB/models/userModel');
const { uploadSingleImage } = require('../middlewares/uploadImage')


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
    const user = await UserModel.findByIdAndUpdate(id ,
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
exports.updateUserPassword = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    //Hashing password
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const user = await UserModel.findByIdAndUpdate(
        id ,
        {password: hashedPassword},
        {new: true, runValidators: true}
    );
    if(!user) {
        return next(new ApiError(`No user for this Id: ${id}`, 404));
    }
    res.status(200).json({data: user});
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