const crypto = require('crypto');

const hashResetCode = (code) => crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

module.exports = hashResetCode;