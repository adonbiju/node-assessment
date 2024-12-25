const handleError = (err, req, res, next) => {
  const { message, statusCode, isOperational } = err;

  // Log errors with request context
  console.error('Error:', {
    message: message || 'No error message',
    stack: err.stack,
    statusCode: statusCode || 500,
    isOperational: isOperational || false,
    requestPath: req?.path || 'unknown',
    requestMethod: req?.method || 'unknown',
  });

  if (!res || res.headersSent) {
    // If `res` is unavailable or response headers are already sent, pass to next middleware
    return next ? next(err) : null; // Use next if available
  }

  if (isOperational) {
    // Client-friendly operational error
    return res.status(statusCode || 500).json({
      success: false,
      error: message || 'Internal Server Error',
    });
  } else {
    // Generic response for unexpected errors
    return res.status(500).json({
      success: false,
      error: 'Something went wrong',
    });
  }
};

module.exports = { handleError };
