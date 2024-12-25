const rateLimit = require('express-rate-limit');

// Define a rate limiter to limit requests per IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  headers: true,
});

module.exports = { limiter };
