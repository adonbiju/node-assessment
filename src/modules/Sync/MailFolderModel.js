const ElasticSearch = require('../../core/database/ElasticSearch');
const RedisClient = require('../../core/database/RedisClient');
const { handleError } = require('../../core/utils/ErrorHandler');

class MailFolderModel {
  // Initialize the mail folders index with proper mappings
  static async initialize() {
    const folderMapping = {
      mappings: {
        properties: {
          userId: { type: 'keyword' },
          folderId: { type: 'keyword' },
          displayName: { 
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          parentFolderId: { type: 'keyword' },
          childFolderCount: { type: 'integer' },
          unreadItemCount: { type: 'integer' },
          totalItemCount: { type: 'integer' },
          isHidden: { type: 'boolean' },
          created_at: { type: 'date' },
          updated_at: { type: 'date' }
        }
      }
    };

    try {
      const indexExists = await ElasticSearch.client.indices.exists({
        index: 'mailfolders'
      });

      if (!indexExists) {
        await ElasticSearch.client.indices.create({
          index: 'mailfolders',
          body: folderMapping
        });
        console.log('Mail folders index created successfully');
      }
    } catch (error) {
      handleError(error, 'Error initializing mail folders index');
      throw error;
    }
  }

  // Save a mail folder
  static async saveFolder(folderData) {
    try {
      const response = await ElasticSearch.indexDocument('mailfolders', folderData.folderId, {
        ...folderData,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Cache the folder in Redis
      await RedisClient.set(`folder:${folderData.folderId}`, folderData, 3600);

      return response;
    } catch (error) {
      handleError(error, 'Error saving mail folder');
      throw error;
    }
  }

// Get user's mail folders
static async getUserFolders(userId) {
    try {
      const cacheKey = `folders:${userId}`;
      const cachedFolders = await RedisClient.get(cacheKey);
  
      if (cachedFolders) {
        return cachedFolders;
      }
  
      const folders = await ElasticSearch.search('mailfolders', {
        query: {
          term: { 
            userId: userId 
          }
        },
        sort: [
          { 'displayName.keyword': 'asc' }
        ]
      });
  
      if (folders && folders.length > 0) {
        await RedisClient.set(cacheKey, folders, 3600);
      }
  
      return folders || [];
    } catch (error) {
      handleError(error, 'Error fetching user folders');
      throw error;
    }
  }

  // Update folder metadata (e.g., unread count)
  static async updateFolderMetadata(folderId, updates) {
    try {
      const folder = await ElasticSearch.getDocumentById('mailfolders', folderId);
      
      if (!folder) {
        throw new Error('Folder not found');
      }

      const updatedFolder = {
        ...folder,
        ...updates,
        updated_at: new Date()
      };

      await ElasticSearch.indexDocument('mailfolders', folderId, updatedFolder);
      await RedisClient.delete(`folder:${folderId}`);
      await RedisClient.delete(`folders:${folder.userId}`);

      return updatedFolder;
    } catch (error) {
      handleError(error, 'Error updating folder metadata');
      throw error;
    }
  }

  // Delete a mail folder
  static async deleteFolder(folderId) {
    try {
      const folder = await ElasticSearch.getDocumentById('mailfolders', folderId);
      
      if (!folder) {
        throw new Error('Folder not found');
      }

      await ElasticSearch.deleteDocument('mailfolders', folderId);
      await RedisClient.delete(`folder:${folderId}`);
      await RedisClient.delete(`folders:${folder.userId}`);

      return { success: true, message: 'Folder deleted successfully' };
    } catch (error) {
      handleError(error, 'Error deleting folder');
      throw error;
    }
  }
}

module.exports = MailFolderModel;