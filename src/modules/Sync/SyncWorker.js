const { OutlookService } = require('../../services/outlook/OutlookService');
const ElasticSearch = require('../../core/database/ElasticSearch'); // Elasticsearch instance
const RedisClient = require('../../core/database/RedisClient'); // Redis instance
const { handleError } = require('../../core/utils/ErrorHandler');

class SyncWorker {
  // Initiate a sync task for the user
  static async initiateSync(userId) {
    try {
      // Create a new sync task in the database or cache (Redis)
      const syncId = await this.createSyncTaskInDatabase(userId);

      // Start the sync process
      await this.startSyncProcess(syncId, userId);

      return syncId;
    } catch (error) {
      handleError(error, 'Error initiating email sync');
      throw error;
    }
  }

  // Create a sync task in Redis or the database
  static async createSyncTaskInDatabase(userId) {
    const syncId = `${userId}-${new Date().getTime()}`;
    console.log(`Sync task created for user ${userId} with ID ${syncId}`);

    // Store sync task status in Redis (can store additional data if needed)
    await RedisClient.set(syncId, { status: 'in-progress', userId });

    return syncId;
  }

  // Start the sync process: Fetch emails and index them
  static async startSyncProcess(syncId, userId) {
    try {
      // Get the user's access token (This should be implemented in a separate service)
      const accessToken = await this.getUserAccessToken(userId);
      const outlookService = new OutlookService(accessToken);
      
      // Fetch emails (limit can be adjusted as needed)
      const emails = await outlookService.fetchEmails({ limit: 10 });

      console.log(`Email sync completed for user ${userId}. Sync ID: ${syncId}`);
      console.log(`Fetched Emails:`, emails.data);

      // Index the fetched emails into Elasticsearch
      await this.indexEmails(userId, emails.data);

      // Update sync status in Redis to 'completed'
      await RedisClient.set(syncId, { status: 'completed', userId, emails: emails.data });

    } catch (error) {
      console.error(`Email sync failed for user ${userId}. Sync ID: ${syncId}`);
      // Update sync status in Redis to 'failed'
      await RedisClient.set(syncId, { status: 'failed', userId });
      handleError(error, 'Error during email sync process');
    }
  }

  // Fetch the user's access token (this should be implemented according to your auth system)
  static async getUserAccessToken(userId) {
    // Replace with actual token retrieval logic
    const accessToken = 'user-specific-access-token'; // Placeholder access token
    return accessToken;
  }

  // Index emails into Elasticsearch
  static async indexEmails(userId, emails) {
    try {
      for (const email of emails) {
        // Index each email for the specific user
        await SyncModel.indexEmail(userId, email);
      }
      console.log(`Successfully indexed emails for user ${userId}`);
    } catch (error) {
      console.error(`Error indexing emails for user ${userId}`, error);
      throw error;
    }
  }

  // Get the sync status for a specific syncId
  static async getSyncStatus(syncId) {
    try {
      // Fetch the sync status from Redis
      const syncData = await RedisClient.get(syncId);
      if (!syncData) {
        throw new Error('Sync task not found');
      }
      return syncData;
    } catch (error) {
      console.error('Error retrieving sync status', error);
      throw error;
    }
  }
}

module.exports = SyncWorker;
