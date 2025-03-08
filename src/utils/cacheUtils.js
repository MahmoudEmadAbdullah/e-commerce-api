const { client }  = require('../config/redisConfig');


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

module.exports = { deleteCacheKeys };
