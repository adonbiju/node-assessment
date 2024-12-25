const express = require('express');
const UserController = require('./UserController');

const router = express.Router();

// Routes for user management
router.post('/create', UserController.createAccount); // Account creation route
router.get('/:userId', UserController.getUserInfo); // Get user details

// OAuth routes
router.get('/auth/outlook', UserController.initiateOutlookAuth);// Link Outlook account
router.get('/auth/outlook/callback', UserController.handleOutlookCallback);// Link Outlook account

module.exports = router;
