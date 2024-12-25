module.exports = {
  name: process.env.APP_NAME || 'Email Engine',
  environment: process.env.NODE_ENV || 'development',
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  PORT: process.env.PORT || 3000,  // Add the PORT variable with a default value
};
