const redis = require('redis');
const { host, port, password, ttl } = require('../config/redis'); // Assuming your config is here

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      url: `redis://${host}:${port}`, // Correct URL format
      password: password // optional
    });

    // Establish the connection
    this.client.connect().then(() => {
      console.log('Connected to Redis.');
    }).catch((error) => {
      console.error('Error connecting to Redis:', error);
    });

    this.client.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  // Set a key with an expiration time in Redis
  async set(key, value, expirationInSeconds = 3600) {
    try {
      await this.client.set(key, JSON.stringify(value), {
        EX: expirationInSeconds,
      });
      console.log(`Key "${key}" set successfully.`);
    } catch (error) {
      console.error('Error setting key in Redis:', error);
    }
  }

  // Get a value by key from Redis
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting key from Redis:', error);
      throw error;
    }
  }

  // Delete a key from Redis
  async delete(key) {
    try {
      await this.client.del(key);
      console.log(`Key "${key}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting key from Redis:', error);
    }
  }
}

module.exports = new RedisClient();
