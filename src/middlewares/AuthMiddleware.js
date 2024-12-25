const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../core/config/app');

const { logger } = require('../core/utils/Logger');

const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    logger.error('Authentication token is missing');
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      logger.error('Invalid or expired token');
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded; // Attach decoded token to the request object
    next(); // Proceed to the next middleware or route handler
  });
};

module.exports = { authenticate };
