const jwt = require('jsonwebtoken');

//Function to generate Access Token
const generateAccessToken = (userId) => jwt.sign(
    { userId }, 
    process.env.JWT_ACCESS_SECRET, 
    {expiresIn: process.env.JWT_ACCESS_EXPIRE}
);

// Function to generate Refresh Token
const generateRefreshToken = (userId) => jwt.sign(
    { userId }, 
    process.env.JWT_REFRESH_SECRET, 
    {expiresIn: process.env.JWT_REFRESH_EXPIRE}
);

module.exports = { generateAccessToken, generateRefreshToken };


