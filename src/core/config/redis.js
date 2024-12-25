const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    host: process.env.REDIS_HOST1 || '127.0.0.1',
    port: process.env.REDIS_PORT1 || 6379,
    password: process.env.REDIS_PASSWORD1 || null,
    ttl: 3600, // Default TTL for cached data in seconds
  };
  