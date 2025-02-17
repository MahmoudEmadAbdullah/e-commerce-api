const { validationResult } = require('express-validator');


/*
 * @desc Validates request data using express-validator's validation chain.
 * Automatically returns 400 error response with validation errors array if validation fails.
 */
const validatorMiddelware = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }
    next();
};


module.exports = validatorMiddelware;