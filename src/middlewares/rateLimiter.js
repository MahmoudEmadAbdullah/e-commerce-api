const asyncHandler = require('express-async-handler');
const { getRedisClient } = require('../config/redisConfig');

const WINDOW_SIZE_IN_SECONDE = 60;
const MAX_REQUESTS = 5;

const rateLimiter = asyncHandler(async (req, res, next) => {
    const client = await getRedisClient();
    const ip = req.ip;
    const key = `rate_limit:${ip}`;
    const current = await client.get(key);
    if(current) {
        if(current >= MAX_REQUESTS) {
            return res.status(429).json({message: 'Too many requests, please try again later.' });
        }
        await client.incr(key);
    } else {
        await client.set(key, 1, { EX: WINDOW_SIZE_IN_SECONDE });
    }

    next();
});


module.exports = rateLimiter;