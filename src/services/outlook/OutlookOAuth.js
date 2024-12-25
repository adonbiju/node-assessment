const axios = require('axios');
const { outlook } = require('../../core/config/oauth');
const querystring = require('querystring');

class OutlookOAuth {
  static getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: outlook.clientId,
      response_type: 'code',
      redirect_uri: outlook.callbackURL,
      scope: outlook.scope,
      state,
    });
    return `${outlook.authorizationURL}?${params.toString()}`;
  }

  static async getAccessToken(authCode) {
    try {
      const response = await axios.post(outlook.tokenURL, querystring.stringify({
        client_id: outlook.clientId,
        client_secret: outlook.clientSecret,
        code: authCode,
        redirect_uri: outlook.callbackURL,
        grant_type: 'authorization_code',
        scope: outlook.scope
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data; // Includes accessToken and refreshToken
    } catch (error) {
      throw new Error('Error exchanging authorization code for access token');
    }
  }

  static async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(outlook.tokenURL, querystring.stringify({
        client_id: outlook.clientId,
        client_secret: outlook.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data; // Includes new accessToken
    } catch (error) {
      throw new Error('Error refreshing access token');
    }
  }
}

module.exports = OutlookOAuth;
