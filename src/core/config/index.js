const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  app: {
    port: process.env.PORT || 3000,
  },
  database: {
    elasticsearch: require('./elasticsearch'),
    redis: require('./redis'),
  },
  oauth: require('./oauth'),
};
