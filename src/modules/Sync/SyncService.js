const SyncModel = require('./SyncModel');
const RedisClient = require('../../core/database/RedisClient');
const OutlookService = require('../../services/outlook/OutlookService');
const { handleError } = require('../../core/utils/ErrorHandler');
const MailFolderModel = require('./MailFolderModel');
const UserService=require('../User/UserService')
class SyncService {
  // Start email sync for a specific user
  static async startEmailSync(userId) {
    try {
      // Generate a unique sync ID
      const syncId = await this.createSyncTask(userId);

      // Start the email sync process
      await this.syncEmails(syncId, userId);

      return { syncId };
    } catch (error) {
      handleError(error, 'Error starting email sync');
      throw error;
    }
  }

  // Create sync task in Redis
  static async createSyncTask(userId) {
    const syncId = `${userId}-${new Date().getTime()}`;
    console.log(`Sync task created for user ${userId} with ID ${syncId}`);
    
    await RedisClient.set(syncId, { 
      status: 'in-progress', 
      userId,
      startTime: new Date().toISOString()
    });

    return syncId;
  }

  // Sync emails for a specific user
  static async syncEmails(syncId, userId) {
    try {
      const accessToken = await this.getUserAccessToken(userId);
      const outlookService = new OutlookService(accessToken);
      
      // Fetch emails from Outlook
      const emailResponse = await outlookService.fetchEmails({ limit: 10 });
      console.log(`Email sync completed for user ${userId}. Sync ID: ${syncId}`);
      
      // Check if we have messages in the response
      const emails = emailResponse?.messages || [];
      console.log(`Fetched ${emails.length} emails`);
      
      if (emails.length > 0) {
        await this.indexEmails(userId, emails);
      }

      // Fetch and index mail folders
      const folders = await outlookService.getMailFolders();
      console.log(`Fetched ${folders.length} folders for user ${userId}`);
      
      if (folders.length > 0) {
        for (const folder of folders) {
          await MailFolderModel.saveFolder({
            userId,
            folderId: folder.id,
            displayName: folder.displayName,
            parentFolderId: folder.parentFolderId,
            childFolderCount: folder.childFolderCount || 0,
            unreadItemCount: folder.unreadItemCount || 0,
            totalItemCount: folder.totalItemCount || 0,
            isHidden: folder.isHidden || false
          });
        }
      }

      // Update sync status in Redis
      await RedisClient.set(syncId, { 
        status: 'completed', 
        userId,
        emailCount: emails.length,
        folderCount: folders.length,
        completedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error(`Email sync failed for user ${userId}. Sync ID: ${syncId}`);
      await RedisClient.set(syncId, { 
        status: 'failed', 
        userId,
        error: error.message,
        failedAt: new Date().toISOString()
      });
      handleError(error, 'Error during email sync process');
    }
  }

  // Get the access token for the user
  static async getUserAccessToken(userId) {
    const user = await UserService.getUserDetails(userId);
    const accessToken = user.outlookToken.access_token;
    return accessToken;
  }

  // Index emails into Elasticsearch
  static async indexEmails(userId, emails) {
    try {
      if (!Array.isArray(emails)) {
        throw new Error('Expected emails to be an array');
      }

      for (const email of emails) {
        if (!email.id) {
          console.warn('Skipping email without ID:', email);
          continue;
        }

        const emailData = {
          messageId: email.id,
          subject: email.subject,
          receivedDateTime: email.receivedDateTime,
          from: email.from,
          isRead: email.isRead,
          bodyPreview: email.bodyPreview
        };

        await SyncModel.indexEmail(userId, emailData);
      }
      console.log(`Successfully indexed ${emails.length} emails for user ${userId}`);
    } catch (error) {
      console.error(`Error indexing emails for user ${userId}:`, error);
      throw error;
    }
  }

  // Get sync status
  static async getSyncStatus(syncId) {
    try {
      const syncData = await RedisClient.get(syncId);
      if (!syncData) {
        throw new Error('Sync task not found');
      }
      return syncData;
    } catch (error) {
      console.error('Error retrieving sync status:', error);
      throw error;
    }
  }
  // Send an email
  static async sendEmail(userId, emailData) {
    try {
      const accessToken = await this.getUserAccessToken(userId);
      const outlookService = new OutlookService(accessToken);
      
      // Format the data for OutlookService
      const outlookEmailData = {
        subject: emailData.subject,
        body: emailData.body,
        toRecipients: emailData.to.map(recipient => recipient.address),
        ccRecipients: emailData.cc.map(recipient => recipient.address),
        attachments: emailData.attachments
      };
  
      await outlookService.sendEmail(outlookEmailData);
  
      // Return the email data with sent status
      return {
        ...emailData,
        status: 'sent',
        sentAt: new Date().toISOString()
      };
    } catch (error) {
      handleError(error, 'Error sending email');
      throw error;
    }
  }

  // Mark email as read/unread
  static async markEmailAsRead(userId, messageId, isRead = true) {
    try {
      const accessToken = await this.getUserAccessToken(userId);
      const outlookService = new OutlookService(accessToken);
      
      await outlookService.markAsRead(messageId, isRead);

      return {
        messageId,
        isRead,
        userId,
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      handleError(error, 'Error marking email as read/unread');
      throw error;
    }
  }

  // Move email to a different folder
  static async moveEmail(userId, messageId, destinationFolderId) {
    try {
      const accessToken = await this.getUserAccessToken(userId);
      const outlookService = new OutlookService(accessToken);
      
      await outlookService.moveEmail(messageId, destinationFolderId);

      return {
        messageId,
        destinationFolderId,
        userId,
        movedAt: new Date().toISOString()
      };
    } catch (error) {
      handleError(error, 'Error moving email');
      throw error;
    }
  }

  // Delete an email
  static async deleteEmail(userId, messageId) {
    try {
      const accessToken = await this.getUserAccessToken(userId);
      const outlookService = new OutlookService(accessToken);
      
      await outlookService.deleteEmail(messageId);

      return {
        messageId,
        userId,
        deletedAt: new Date().toISOString(),
        status: 'deleted'
      };
    } catch (error) {
      handleError(error, 'Error deleting email');
      throw error;
    }
  }

  // Search emails
  static async searchEmails(userId, query, options = { limit: 20, skip: 0 }) {
    try {
      const accessToken = await this.getUserAccessToken(userId);
      const outlookService = new OutlookService(accessToken);
      
      const searchResults = await outlookService.searchEmails(query, options);

      // Transform the results to match your application's format
      const transformedResults = searchResults.messages.map(email => ({
        messageId: email.id,
        subject: email.subject,
        receivedDateTime: email.receivedDateTime,
        from: email.from,
        isRead: email.isRead,
        bodyPreview: email.bodyPreview,
        userId
      }));

      return {
        results: transformedResults,
        nextLink: searchResults.nextLink,
        total: transformedResults.length
      };
    } catch (error) {
      handleError(error, 'Error searching emails');
      throw error;
    }
  }
}

module.exports = SyncService;