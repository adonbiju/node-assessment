const SyncService = require('./SyncService');
const ElasticSearch = require('../../core/database/ElasticSearch');
const RedisClient = require('../../core/database/RedisClient');
const { handleError } = require('../../core/utils/ErrorHandler');
const MailFolderModel=require('./MailFolderModel')
class SyncController {
  // Start email sync for a user
  static async startSync(req, res) {
    try {
      const { userId } = req.body;
      const syncResult = await SyncService.startEmailSync(userId);
      
      // Cache the sync status in Redis
      await RedisClient.set(`sync-status:${syncResult.syncId}`, JSON.stringify({ status: 'in-progress' }));
      
      res.status(200).json(syncResult);
    } catch (error) {
      handleError(error, 'Error starting email sync');
      res.status(500).json({ message: 'Error starting email sync' });
    }
  }

  // Check sync status from Redis or Elasticsearch
  static async checkSyncStatus(req, res) {
    try {
      const { syncId } = req.params;

      // First, try to get the sync status from Redis cache
      const cachedStatus = await RedisClient.get(`sync-status:${syncId}`);
      if (cachedStatus) {
        return res.status(200).json(JSON.parse(cachedStatus));
      }

      // If not found in Redis, fall back to Elasticsearch
      const syncStatus = await ElasticSearch.search('sync-status', {
        query: {
          match: { syncId }
        }
      });

      if (syncStatus.length > 0) {
        return res.status(200).json(syncStatus[0]);
      }

      res.status(404).json({ message: 'Sync task not found' });
    } catch (error) {
      handleError(error, 'Error checking sync status');
      res.status(500).json({ message: 'Error checking sync status' });
    }
  }

  // Get user's emails from Elasticsearch
  static async getUserEmails(req, res) {
    try {
      const { userId } = req.params;
      const emails = await ElasticSearch.search('emails', {
        query: {
          match: { userId }
        }
      });
      res.status(200).json(emails);
    } catch (error) {
      handleError(error, 'Error fetching user emails');
      res.status(500).json({ message: 'Error fetching user emails' });
    }
  }

  // Get user's mail folders from Elasticsearch
  static async getMailFolders(req, res) {
    try {
      const { userId } = req.params;
      const mailFolders = await MailFolderModel.getUserFolders(userId);
      res.status(200).json(mailFolders);
    } catch (error) {
      handleError(error, 'Error fetching user mail folders');
      res.status(500).json({ message: 'Error fetching user mail folders' });
    }
  }

  // Get specific email details from Elasticsearch
  static async getEmailDetails(req, res) {
    try {
      const { userId, messageId } = req.params;
      const emailDetails = await ElasticSearch.search('emails', {
        query: {
          bool: {
            must: [
              { match: { userId } },
              { match: { messageId } }
            ]
          }
        }
      });
      if (emailDetails.length > 0) {
        res.status(200).json(emailDetails[0]);
      } else {
        res.status(404).json({ message: 'Email not found' });
      }
    } catch (error) {
      handleError(error, 'Error fetching email details');
      res.status(500).json({ message: 'Error fetching email details' });
    }
  }

  // Send an email
  static async sendEmail(req, res) {
    try {
      const { userId } = req.params;
      const { subject, body, to, cc, attachments } = req.body;
      
      // Validate required fields
      if (!subject || !body || !to) {
        return res.status(400).json({ 
          message: 'Missing required fields. Please provide subject, body, and to recipients.' 
        });
      }
  
      // Format recipients properly
      const formattedEmailData = {
        subject,
        body,
        to: Array.isArray(to) ? to.map(email => ({ address: email })) : [{ address: to }],
        cc: cc ? (Array.isArray(cc) ? cc.map(email => ({ address: email })) : [{ address: cc }]) : [],
        attachments: attachments || [],
        userId,
        messageId: `${userId}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
  
      // Send the email through SyncService
      const result = await SyncService.sendEmail(userId, formattedEmailData);
      
      // Index the email in Elasticsearch with properly formatted data
      await ElasticSearch.indexDocument('emails', formattedEmailData.messageId, formattedEmailData);
      
      res.status(200).json(result);
    } catch (error) {
      handleError(error, 'Error sending email');
      res.status(500).json({ message: 'Error sending email' });
    }
  }


  // Mark an email as read/unread
  static async markAsRead(req, res) {
    try {
      const { userId, messageId } = req.params;
      const result = await SyncService.markEmailAsRead(userId, messageId);

      // Update the email status in Elasticsearch
      await ElasticSearch.indexDocument('emails', messageId, result);

      res.status(200).json(result);
    } catch (error) {
      handleError(error, 'Error marking email as read/unread');
      res.status(500).json({ message: 'Error marking email as read/unread' });
    }
  }

  // Move an email to a folder
  static async moveEmail(req, res) {
    try {
      const { userId, messageId } = req.params;
      const { folder } = req.body;
      const result = await SyncService.moveEmail(userId, messageId, folder);
      
      // Optionally, update email folder in Elasticsearch
      await ElasticSearch.indexDocument('emails', messageId, result);
      
      res.status(200).json(result);
    } catch (error) {
      handleError(error, 'Error moving email');
      res.status(500).json({ message: 'Error moving email' });
    }
  }

  // Delete an email
  static async deleteEmail(req, res) {
    try {
      const { userId, messageId } = req.params;
      const result = await SyncService.deleteEmail(userId, messageId);

      // Delete the email from Elasticsearch
      await ElasticSearch.deleteDocument('emails', messageId);

      // Optionally, remove sync status from Redis
      await RedisClient.delete(`sync-status:${messageId}`);
      
      res.status(200).json(result);
    } catch (error) {
      handleError(error, 'Error deleting email');
      res.status(500).json({ message: 'Error deleting email' });
    }
  }

  // Search emails
  static async searchEmails(req, res) {
    try {
      const { userId } = req.params;
      const { searchText } = req.body; // Change from query to searchText for clarity
  
      // Validate search input
      if (!searchText || typeof searchText !== 'string') {
        return res.status(400).json({
          message: 'Please provide a valid search text'
        });
      }
  
      const result = await ElasticSearch.search('emails', {
        body: {
          query: {
            bool: {
              must: [
                { term: { userId: userId } },
                {
                  multi_match: {
                    query: searchText,
                    fields: ['subject^2', 'body', 'to.address', 'cc.address'], // Boost subject relevance
                    type: 'best_fields',
                    operator: 'and',
                    fuzziness: 'AUTO'
                  }
                }
              ]
            }
          },
          sort: [
            { timestamp: { order: 'desc' } } // Sort by timestamp descending
          ],
          size: 50 // Limit results
        }
      });
  
      // Add metadata to response
      const response = {
        results: result,
        total: result.length,
        searchTerm: searchText
      };
  
      res.status(200).json(response);
    } catch (error) {
      handleError(error, 'Error searching emails');
      res.status(500).json({ message: 'Error searching emails' });
    }
  }
}

module.exports = SyncController;
