const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const generateToken = require('../utils/generateToken')
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



