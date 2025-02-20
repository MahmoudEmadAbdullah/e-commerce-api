const jwt = require('jsonwebtoken');

//Function to generate Token
const generateToken = (payload) => jwt.sign(
    {userId: payload}, 
    process.env.JWT_SECRET, 
    {expiresIn: process.env.JWT_EXPIRE_DATE}
);

module.exports = generateToken;


