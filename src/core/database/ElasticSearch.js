const { Client } = require("@elastic/elasticsearch");
const { host, username, password, index } = require('../config/elasticsearch'); // Assuming your config is here

class ElasticSearch {
  constructor() {
    // Make sure to use the correct host configuration and authentication if provided
    this.client = new Client({
      node: host, // Use the correct environment variable (host)
      auth: username && password ? { username, password } : undefined, // Use authentication only if credentials are provided
    });
  }

  // Create an index with mappings
  async createIndex(indexName, mappings) {
    try {
      // Ensure that the index exists using the correct method based on your Elasticsearch version
      const exists = await this.client.indices.exists({ index: indexName });
      if (!exists) {
        await this.client.indices.create({
          index: indexName,
          body: { mappings },
        });
        console.log(`Index "${indexName}" created successfully.`);
      } else {
        console.log(`Index "${indexName}" already exists.`);
      }
    } catch (error) {
      console.error("Error creating index:", error);
    }
  }

  // Index a document
  async indexDocument(indexName, id, document) {
    try {
      const response = await this.client.index({
        index: indexName,
        id,
        body: document,
        refresh: true, // Makes the document available for search immediately
      });
      return response;
    } catch (error) {
      console.error("Error indexing document:", error);
      throw error;
    }
  }


// Search documents in a specific index
async search(indexName, query) {
  try {
    const result = await this.client.search({
      index: indexName,
      ...query  // Spread the query parameters directly
    });
    
    const hits = result.hits?.hits;
    if (!hits) {
      return [];
    }

    return hits.map((hit) => ({
      ...hit._source,
      _id: hit._id
    }));
  } catch (error) {
    if (error.meta?.body?.error?.type === 'index_not_found_exception') {
      return [];
    }
    console.error("Error searching Elasticsearch:", error);
    throw error;
  }
}
    // Delete a document by ID
    async deleteDocument(indexName, documentId) {
      try {
        // Check if the document exists before trying to delete
        const exists = await this.client.exists({
          index: indexName,
          id: documentId,
        });
  
        if (!exists) {
          console.log(`Document with ID ${documentId} does not exist.`);
          return false;
        }
  
        // Delete the document
        const response = await this.client.delete({
          index: indexName,
          id: documentId,
          refresh: true, // Makes the deletion immediately visible for future searches
        });
  
        console.log(`Document with ID ${documentId} deleted successfully.`);
        return response;
      } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
      }
    }
}

module.exports = new ElasticSearch();