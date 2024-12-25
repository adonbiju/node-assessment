const express = require('express');
const SyncController = require('./SyncController'); // Sync-related controllers
const router = express.Router();


// Routes for email synchronization
router.post('/start-sync', SyncController.startSync); // Start email sync for a user
router.get('/status/:syncId', SyncController.checkSyncStatus); // Check sync status

// Routes for email management
router.get('/:userId/emails', SyncController.getUserEmails); // Get user's emails
router.get('/:userId/mailfolders', SyncController.getMailFolders); // Get user's mail folders
router.get('/:userId/emails/details/:messageId', SyncController.getEmailDetails); // Get specific email details

router.post('/:userId/emails/send', SyncController.sendEmail); // Send an email
router.post('/:userId/emails/search', SyncController.searchEmails); // Search emails

router.patch('/:userId/emails/markAsRead/:messageId', SyncController.markAsRead); // Mark email as read/unread
router.post('/:userId/emails/move/:messageId', SyncController.moveEmail); // Move email to a folder
router.delete('/:userId/emails/delete/:messageId', SyncController.deleteEmail); // Delete email


module.exports = router;
