const redis = require("ioredis");

// Default redis host & port
const redisClient = new redis();

// Function to get data from Redis cache
exports.getFromCache = async (cacheKey) => {
  try {
    const data = await redisClient.get(cacheKey);
    if (data === null) {
      return null; // No data in cache, return null
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Error fetching data from Redis cache:", error);
    throw new Error('An error occurred while getting data from Redis cache.');
  }
};

// Function to set data in Redis cache with an optional expiration time (in seconds)
exports.setInCache = async (cacheKey, data, expireTime) => {
  try {
    await redisClient.set(cacheKey, JSON.stringify(data), "EX", expireTime);
    console.log("Data set in Redis cache successfully.");
  } catch (error) {
    console.error("Error setting data in Redis cache:", error);
    throw new Error('An error occurred while setting data in Redis cache.');
  }
};

// Function to invalidate cache for a given cache key
exports.invalidateCache = async (cacheKey) => {
  try {
    await redisClient.del(cacheKey); // Using Promise del 
  } catch (error) {
    console.error("Error invalidating cache:", error);
    throw new Error('An error occurred while invalidating cache.');
  }
};

// Function to check if cache key exists
exports.checkCacheKeyExists = async (cacheKey) => {
  try {
    const exists = await redisClient.exists(cacheKey);
    return exists === 1;
  } catch (error) {
    console.error("Error checking cache key:", error);
    throw new Error('An error occurred while checking cache key.');
  } 
};

// Function to view all cache keys
exports.viewAllCacheKeys = async () => {
  try {
    const keys = await redisClient.keys('*'); // 使用通配符 '*' 來匹配所有 key
    return keys;
  } catch (error) {
    console.error("Error viewing cache keys:", error);
    throw new Error('An error occurred while viewing cache keys.');
  }
};
