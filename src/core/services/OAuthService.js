class OAuthService {
  constructor() {
    if (this.constructor === OAuthService) {
      throw new Error("Cannot instantiate an abstract class");
    }
  }

  async getAuthUrl(state) {
    throw new Error("Method 'getAuthUrl()' must be implemented.");
  }

  async getAccessToken(authCode) {
    throw new Error("Method 'getAccessToken()' must be implemented.");
  }

  async refreshAccessToken(refreshToken) {
    throw new Error("Method 'refreshAccessToken()' must be implemented.");
  }
}

module.exports = OAuthService;
