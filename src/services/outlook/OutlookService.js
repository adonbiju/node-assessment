const axios = require('axios');
const OUTLOOK_API_URL = 'https://graph.microsoft.com/v1.0';

class OutlookService {
  constructor(accessToken) {
    if (!accessToken) {
      throw new Error('Access token is required');
    }
    this.accessToken = accessToken;
    this.axiosInstance = axios.create({
      baseURL: OUTLOOK_API_URL,
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          const { status, data } = error.response;
          
          switch (status) {
            case 401:
              throw new Error('Authentication token expired or invalid');
            case 403:
              throw new Error('Insufficient permissions. Make sure Mail.Send permission is granted');
            case 404:
              throw new Error('Resource not found');
            default:
              throw new Error(data?.error?.message || 'An error occurred while sending email');
          }
        }
        throw error;
      }
    );
  }
  async verifyTokenAndTenant() {
    try {
      await this.axiosInstance.get('/me');
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  async fetchEmails({ limit = 20, skip = 0, folderId = 'inbox' }) {
    const endpoint = folderId === 'inbox' 
      ? '/me/messages'
      : `/me/mailFolders/${folderId}/messages`;

    const response = await this.axiosInstance.get(endpoint, {
      params: {
        $top: limit,
        $skip: skip,
        $orderby: 'receivedDateTime desc',
        $select: 'id,subject,receivedDateTime,from,isRead,bodyPreview'
      }
    });

    return {
      messages: response.data.value,
      nextLink: response.data['@odata.nextLink']
    };
  }

  async getMailFolders() {
    const response = await this.axiosInstance.get('/me/mailFolders', {
      params: {
        $select: 'id,displayName,unreadItemCount,totalItemCount'
      }
    });
    return response.data.value;
  }

  async getEmailDetails(messageId) {
    const response = await this.axiosInstance.get(`/me/messages/${messageId}`, {
      params: {
        $select: 'id,subject,receivedDateTime,from,toRecipients,ccRecipients,body,attachments'
      }
    });
    return response.data;
  }

  async sendEmail({ subject, body, toRecipients, ccRecipients = [], attachments = [] }) {
    // Validate inputs
    if (!Array.isArray(toRecipients)) {
      throw new Error('toRecipients must be an array');
    }
    console.log("i am here")
    // Format the message for Microsoft Graph API
    const message = {
      subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: toRecipients.map(email => ({
        emailAddress: {
          address: typeof email === 'string' ? email : email.address || email.email
        }
      })),
      ccRecipients: Array.isArray(ccRecipients) ? ccRecipients.map(email => ({
        emailAddress: {
          address: typeof email === 'string' ? email : email.address || email.email
        }
      })) : []
    };

    // Add attachments if present
    if (attachments && attachments.length > 0) {
      message.attachments = attachments;
    }

    // Send the email
    await this.axiosInstance.post('/me/sendMail', { message });
  }

  async markAsRead(messageId, isRead = true) {
    await this.axiosInstance.patch(`/me/messages/${messageId}`, {
      isRead
    });
  }

  async moveEmail(messageId, destinationFolderId) {
    await this.axiosInstance.post(`/me/messages/${messageId}/move`, {
      destinationId: destinationFolderId
    });
  }

  async deleteEmail(messageId) {
    await this.axiosInstance.delete(`/me/messages/${messageId}`);
  }

  async searchEmails(query, { limit = 20, skip = 0 }) {
    const response = await this.axiosInstance.get('/me/messages', {
      params: {
        $search: `"${query}"`,
        $top: limit,
        $skip: skip,
        $select: 'id,subject,receivedDateTime,from,isRead,bodyPreview'
      }
    });
    return {
      messages: response.data.value,
      nextLink: response.data['@odata.nextLink']
    };
  }
}

module.exports = OutlookService;