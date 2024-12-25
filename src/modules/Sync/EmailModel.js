const ElasticSearch = require('../../core/database/ElasticSearch'); // Elasticsearch client
const RedisClient = require('../../core/database/RedisClient'); // Redis client
const SyncModel = require('../Sync/SyncModel'); // Generic sync model for operations
const { handleError } = require('../../core/utils/ErrorHandler');

class EmailModel {
  static async initialize() {
    const emailMappings = {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            subject: { type: 'text' },
            body: { type: 'text' },
            status: { type: 'keyword' },
            timestamp: { type: 'date' },
            userId: { type: 'keyword' },
            to: { 
              type: 'nested',
              properties: {
                address: { type: 'keyword' }
              }
            },
            cc: { 
              type: 'nested',
              properties: {
                address: { type: 'keyword' }
              }
            },
            attachments: {
              type: 'nested',
              properties: {
                name: { type: 'keyword' },
                contentType: { type: 'keyword' },
                size: { type: 'long' }
              }
            }
          }
        }
      };

    try {
      const indexExists = await ElasticSearch.client.indices.exists({
        index: 'emails',
      });

      if (!indexExists) {
        await ElasticSearch.client.indices.create({
          index: 'emails',
          body: emailMapping,
        });
        console.log('Emails index created successfully');
      }
    } catch (error) {
      handleError(error, 'Error initializing emails index');
      throw error;
    }
  }

  // Save an email document
  static async saveEmail(emailData) {
    try {
      // Save to Elasticsearch
      const response = await SyncModel.indexDocument('emails', emailData.messageId, {
        ...emailData,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Cache the email in Redis for quick access
      await RedisClient.set(`email:${emailData.messageId}`, emailData);

      return response;
    } catch (error) {
      handleError(error, 'Error saving email');
      throw error;
    }
  }

  // Search emails for a user
  static async searchUserEmails(userId, query) {
    try {
      const cacheKey = `emails:${userId}:${JSON.stringify(query)}`;
      const cachedResults = await RedisClient.get(cacheKey);

      if (cachedResults) {
        console.log('Cache hit for search query');
        return cachedResults;
      }

      const searchQuery = {
        query: {
          bool: {
            must: [
              { term: { userId } },
              query,
            ],
          },
        },
        sort: [{ receivedDateTime: 'desc' }],
      };

      const results = await SyncModel.search('emails', searchQuery);

      // Cache the results in Redis
      await RedisClient.set(cacheKey, results, 3600); // Cache for 1 hour

      return results;
    } catch (error) {
      handleError(error, 'Error searching user emails');
      throw error;
    }
  }

  // Get email details by message ID
  static async getEmailDetails(messageId) {
    try {
      // Check Redis cache first
      const cachedEmail = await RedisClient.get(`email:${messageId}`);
      if (cachedEmail) {
        console.log('Cache hit for email details');
        return cachedEmail;
      }

      // Fetch from Elasticsearch if not in cache
      const email = await SyncModel.getDocumentById('emails', messageId);

      if (email) {
        // Cache the fetched email
        await RedisClient.set(`email:${messageId}`, email, 3600);
      }

      return email;
    } catch (error) {
      handleError(error, 'Error fetching email details');
      throw error;
    }
  }

  // Delete an email by message ID
  static async deleteEmail(messageId) {
    try {
      // Delete from Elasticsearch
      const response = await SyncModel.deleteDocument('emails', messageId);

      // Remove from Redis cache
      await RedisClient.delete(`email:${messageId}`);

      return response;
    } catch (error) {
      handleError(error, 'Error deleting email');
      throw error;
    }
  }
}

module.exports = EmailModel;
