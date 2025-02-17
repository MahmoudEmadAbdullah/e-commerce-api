/** 
 * @desc     Custom error class for operational errors (errors that can be anticipated and handled).
 * @extends  Error
 * @param    {string} message        - Error message.
 * @param    {number} statusCode     - HTTP status code (4xx for client errors, 5xx for server errors).
 * @property {string} status         - 'fail' for client errors, 'error' for server errors.
 * @property {boolean} isOperational - Indicates if the error is operational (known error) or a programming error.
 */
class ApiError extends Error {
    constructor(message, statusCode){
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';
        this.isOperational = true;
    }
};

module.exports = ApiError;