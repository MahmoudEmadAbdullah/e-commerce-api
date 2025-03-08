const { client }  = require('../config/redisConfig');
const ApiError = require('../utils/apiError');


/**
 * @desc      Get session ID for caching
 * @returns   {string} sessionId
 */
const getSessionId = (req) => {
    if(req.user) {
        return `cart:${req.user._id}`;
    }
    throw new ApiError('You not logged in', 401);
};


/**
 * @desc      Update cache with new cart data
 * @param     {string} sessionId - Cache key
 * @param     {object} cart - Cart data to store
 */
const updateCartCache = async (sessionId, cart) => {
    try {
        await client.set(sessionId, JSON.stringify(cart), { EX: 24 * 60 * 60 });
    } catch (err) {
        console.error(`Error updating cart cache (${sessionId}):`, err);
    }
};


/**
 * @desc      Delete cart from cache
 * @param     {string} sessionId - Cache key to delete
 */
const deleteCartCache = async (sessionId) => {
    try {
        await client.del(sessionId);
    } catch(err) {
        console.error(`Error deleting cart cache (${sessionId}):`, err);
    }
};


/**
 * @desc Delete cache keys matching a given pattern using SCAN & UNLINK
 * @param {string} pattern - Redis key pattern to delete
 */
const deleteCacheKeys = async (pattern) => {
    let cursor = '0';
    let iterationCount = 0;
    const maxIterations = 50; // حماية من الـ infinite loop
    try {
        do {
            const result = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
            cursor = result.cursor;
            if (result.keys && result.keys.length > 0) {
                await client.unlink(result.keys);
            }
            iterationCount++;
            if (iterationCount >= maxIterations) break;
        } while (cursor !== '0');
    } catch (err) {
        console.error(`Error deleting cache keys (${pattern}):`, err);
    }
};


module.exports = { 
    getSessionId,
    updateCartCache,
    deleteCartCache,
    deleteCacheKeys 
};
