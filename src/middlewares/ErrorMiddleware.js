const { logger } = require('../core/utils/Logger');
const { handleError } = require('../core/utils/ErrorHandler');

const errorHandler = (err, req, res, next) => {
  // Log all errors
  logger.error('Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode || 500,
  });

  // Use the handleError utility to respond appropriately
  handleError(err, req, res,next);
};

module.exports = { errorHandler };
