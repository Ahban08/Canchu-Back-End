const cacheUtils = require("../utils/cacheUtils");

class RateLimiter {
    constructor(limit, windowTime) {
      this.limit = limit; // N - maximum number of requests allowed per IP address
      this.windowTime = windowTime * 1000; // M - time window in milliseconds
      this.ipRequests = new Map(); // Map to store IP addresses and their request details
    }

    // Function to check if the IP address has exceeded the request limit
    async isRateLimited(ip) {
      const currentTime = Date.now();
      const blackCacheKey = `black_${ip}`;
      let blackIp, keys ;
      try {
        blackIp = await cacheUtils.checkCacheKeyExists(blackCacheKey);
        keys = await cacheUtils.viewAllCacheKeys();
        console.log("All cache keys:", keys);
        } catch (error) {
        console.error("Error:", error.message);
        }
      if(!blackIp){
        if (!this.ipRequests.has(ip)) {
            // If the IP address is not in the map, add it with initial request count and timestamp
            this.ipRequests.set(ip, { count: 1, timestamp: currentTime });
            return false;
          } else {
            const { count, timestamp } = this.ipRequests.get(ip);
            if (currentTime - timestamp < this.windowTime) {
              // If the time window has not elapsed, check if the request count exceeds the limit
              if (count >= this.limit) {
                cacheUtils.setInCache(blackCacheKey, 1, 60);
                return true; // IP address is rate limited
              } else {
                // Increment the request count for the IP address and update the timestamp
                this.ipRequests.set(ip, { count: count + 1, timestamp: currentTime });
                return false;
              }
            } else {
              // If the time window has elapsed, reset the request count and update the timestamp
              this.ipRequests.set(ip, { count: 1, timestamp: currentTime });
              return false;
            }
          }
      }else{
        return true; // IP address is rate limited
      }
  }
}

// Export the RateLimiter class using exports
module.exports = RateLimiter;
