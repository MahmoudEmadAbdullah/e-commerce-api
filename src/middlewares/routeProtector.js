const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const ApiError = require('../utils/apiError');
const UserModel = require('../../DB/models/userModel');


/**
 * @desc      Protect routes - Ensure user is authenticated (logged in)
 * @middleware
 * @access    private
 */
exports.protect = asyncHandler(async (req, res, next) => {
    //1- check if token exist, if exists catch it
    let token;
    if( req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer'))
    {
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token){
        return next(new ApiError('You are not login, please login to access this route', 401));
    }
    //2- verify token (no changes happens, expired token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //3- check if user exists
    const currentUser = await UserModel.findById(decoded.userId);
    if(!currentUser) {
        return next(
            new ApiError('The user that belong to this token does no longer exists', 401)
        );
    }
    //4- check if user change his password after token created
    if(currentUser.passwordChangedAt) {
        const passwordChangedTimestamp = parseInt(
            currentUser.passwordChangedAt.getTime() / 1000,
            10
        );
        //Password changed after token created
        if(passwordChangedTimestamp > decoded.iat){
            return next(
                new ApiError(
                    'User recently changed his password, please login again..', 401)
            );
        }
    }
    // Grant access to protected route
    req.user = currentUser;
    next();
});


/**
 * @desc      Authorize routes - Allow only specific user roles to access the route
 * @middleware
 * @access    private
 */
exports.allowedTo = (...roles) =>
    asyncHandler(async (req, res, next) => {
        //1- access roles ['user, 'admin]
        if(!roles.includes(req.user.role)) {
            return next(new ApiError(
                'You are not allowed to access this route', 403)
            );
        }
        next();
    //2- access registerd user by (req.user = currentUser) as (req.user.role)

});