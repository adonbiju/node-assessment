const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const {logger} = require('./core/utils/Logger')
const { errorHandler } = require('./middlewares/ErrorMiddleware');
const { authenticate } = require('./middlewares/AuthMiddleware');
const { limiter } = require('./middlewares/RateLimiter');
const syncRoutes = require('./modules/Sync/SyncRoutes');
const userRoutes = require('./modules/User/UserRoutes');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware Setup
app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(limiter); // Apply rate limiting for all requests


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'development' }
}));
// Use Routes
app.use('/api/sync', syncRoutes); // Sync module routes
app.use('/api/user', userRoutes); // User module routes

// Health Check route for API status
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'API is running' });
});

// Use error handling middleware (should be after all route definitions)
app.use(errorHandler); // Global error handler for all errors

module.exports = app;
