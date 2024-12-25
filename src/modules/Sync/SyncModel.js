const ElasticSearch = require('../../core/database/ElasticSearch');
const RedisClient = require('../../core/database/RedisClient');
const { handleError } = require('../../core/utils/ErrorHandler');
const { v4: uuidv4 } = require('uuid');

class SyncModel {
  // Start email sync for a user and return syncId
  static async startEmailSync(userId) {
    try {
      const syncId = uuidv4(); // Generate a unique syncId

      // Cache the sync status as 'in-progress' in Redis
      await RedisClient.set(`sync-status:${syncId}`, JSON.stringify({ status: 'in-progress', userId }));

      // Optionally, index the sync task into Elasticsearch to keep track of sync progress
      await ElasticSearch.indexDocument('sync-status', syncId, {
        userId,
        status: 'in-progress',
        timestamp: new Date().toISOString(),
      });

      console.log(`Sync started for user ${userId}, syncId: ${syncId}`);
      return { syncId, status: 'in-progress' };
    } catch (error) {
      handleError(error, 'Error starting email sync');
      throw error;
    }
  }

  // Check the sync status of a given syncId from Redis or Elasticsearch
  static async checkSyncStatus(syncId) {
    try {
      // First, check Redis cache
      const cachedStatus = await RedisClient.get(`sync-status:${syncId}`);
      if (cachedStatus) {
        return JSON.parse(cachedStatus);
      }

      // If not found in Redis, fallback to Elasticsearch
      const syncStatus = await ElasticSearch.search('sync-status', {
        query: {
          match: { syncId }
        }
      });

      if (syncStatus.length > 0) {
        return syncStatus[0]; // Return the sync status from Elasticsearch
      }

      throw new Error('Sync task not found');
    } catch (error) {
      handleError(error, 'Error checking sync status');
      throw error;
    }
  }

  // Store email in Elasticsearch and update Redis if needed
  static async indexEmail(userId, emailData) {
    try {
      const emailId = uuidv4(); // Generate a unique email ID

      // Index the email in Elasticsearch
      const result = await ElasticSearch.indexDocument('emails', emailId, {
        userId,
        ...emailData,
        timestamp: new Date().toISOString(),
      });

      console.log(`Email indexed: ${emailId}`);
      
      // Optionally, update the sync status in Redis or Elasticsearch if needed
      // For example, you could update the user's sync status after the email is indexed
      await RedisClient.set(`email:${emailId}`, JSON.stringify(result));

      return result;
    } catch (error) {
      handleError(error, 'Error indexing email');
      throw error;
    }
  }

  // Delete email from Elasticsearch and Redis
  static async deleteEmail(userId, emailId) {
    try {
      // Delete the email from Elasticsearch
      await ElasticSearch.deleteDocument('emails', emailId);

      // Optionally, remove the email data from Redis
      await RedisClient.delete(`email:${emailId}`);

      console.log(`Email deleted: ${emailId}`);
      return { success: true, message: 'Email deleted successfully' };
    } catch (error) {
      handleError(error, 'Error deleting email');
      throw error;
    }
  }
}

module.exports = SyncModel;
