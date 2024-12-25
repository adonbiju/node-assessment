const dotenv = require('dotenv');
dotenv.config();
module.exports = {
  host: process.env.ELASTICSEARCH_HOST || 'http://localhost:9200',
  username: process.env.ELASTICSEARCH_USERNAME || '', // Optional username
  password: process.env.ELASTICSEARCH_PASSWORD || '', // Optional password
  index: {
    emails: 'emails', // Replace with your actual index name
    mailboxes: 'mailboxes', // Replace with your actual index name
  },
};
