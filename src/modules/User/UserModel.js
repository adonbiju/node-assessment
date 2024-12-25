const ElasticsearchClient = require('../../core/database/ElasticSearch');
const { handleError } = require('../../core/utils/ErrorHandler');

class UserModel {
  static async initialize() {
    const userMapping = {
      mappings: {
        properties: {
          email: { 
            type: 'keyword' 
          },
          password: { 
            type: 'keyword' 
          },
          outlookToken: {
            properties: {
              accessToken: { type: 'keyword' },
              tokenType: { type: 'keyword' },
              expires_at: { type: 'date' }
            }
          },
          created_at: { 
            type: 'date' 
          },
          updated_at: { 
            type: 'date' 
          }
        }
      },
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1
      }
    };

    try {
      const indexExists = await ElasticsearchClient.client.indices.exists({
        index: 'users'
      });

      if (!indexExists) {
        await ElasticsearchClient.client.indices.create({
          index: 'users',
          body: userMapping
        });
        console.log('Users index created successfully');
      }
    } catch (error) {
      handleError(error, 'Error initializing users index');
      throw error;
    }
  }

  static async createUser(userData) {
    try {
      // Add timestamps
      const now = new Date().toISOString();
      const userDataWithTimestamps = {
        ...userData,
        created_at: now,
        updated_at: now
      };

      const response = await ElasticsearchClient.client.index({
        index: 'users',
        refresh: true, // Make document immediately searchable
        body: userDataWithTimestamps,
      });
      return {
        id: response._id,
        ...userDataWithTimestamps
      };
    } catch (error) {
      handleError(error, 'Error creating user in Elasticsearch');
      throw error;
    }
  }

  static async findUserByEmail(email) {
    try {
      const response = await ElasticsearchClient.client.search({
        index: 'users',
        body: {
          query: {
            term: {  // Using term instead of match for exact email matching
              email: email.toLowerCase()  // Ensure consistent case for emails
            }
          }
        }
      });

      return response.hits.hits.length > 0 
        ? { id: response.hits.hits[0]._id, ...response.hits.hits[0]._source } 
        : null;
    } catch (error) {
      handleError(error, 'Error searching for user by email');
      throw error;
    }
  }

  static async linkOutlookAccount(userId, tokenData) {
    try {
      console.log(userId)
      const response = await ElasticsearchClient.client.update({
        index: 'users',
        id: userId,
        refresh: true,
        body: {
          doc: {
            outlookToken: tokenData,
            updated_at: new Date().toISOString()
          }
        }
      });
      
      // Fetch and return the updated user
      return await this.getUserById(userId);
    } catch (error) {
      handleError(error, 'Error linking Outlook account in Elasticsearch');
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      const response = await ElasticsearchClient.client.get({
        index: 'users',
        id: userId
      });
      
      return {
        id: response._id,
        ...response._source
      };
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        return null;  // Return null for non-existent users
      }
      handleError(error, 'Error fetching user by ID from Elasticsearch');
      throw error;
    }
  }

  static async updateUser(userId, updateData) {
    try {
      const response = await ElasticsearchClient.client.update({
        index: 'users',
        id: userId,
        refresh: true,
        body: {
          doc: {
            ...updateData,
            updated_at: new Date().toISOString()
          }
        }
      });
      
      return await this.getUserById(userId);
    } catch (error) {
      handleError(error, 'Error updating user in Elasticsearch');
      throw error;
    }
  }

  static async deleteUser(userId) {
    try {
      await ElasticsearchClient.client.delete({
        index: 'users',
        id: userId,
        refresh: true
      });
      return true;
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        return false;  // Return false if user doesn't exist
      }
      handleError(error, 'Error deleting user from Elasticsearch');
      throw error;
    }
  }
}

module.exports = UserModel;