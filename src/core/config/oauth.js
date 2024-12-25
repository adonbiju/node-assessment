const dotenv = require('dotenv');
dotenv.config();
module.exports = {
    yahoo: {
      clientId: process.env.YAHOO_CLIENT_ID || "your-yahoo-client-id",
      clientSecret: process.env.YAHOO_CLIENT_SECRET || "your-yahoo-client-secret",
      callbackURL: process.env.YAHOO_OAUTH_CALLBACK_URL || "http://localhost:3000/oauth/yahoo/callback",
      authorizationURL: "https://api.login.yahoo.com/oauth2/request_auth",
      tokenURL: "https://api.login.yahoo.com/oauth2/get_token",
      scope: ["mail-r", "profile", "openid"],
    },
    outlook: {
      clientId: process.env.OAUTH_CLIENT_ID || "your-outlook-client-id",
      clientSecret: process.env.OAUTH_CLIENT_SECRET || "your-outlook-client-secret",
      callbackURL: process.env.OAUTH_REDIRECT_URI || "http://localhost:3000/oauth/outlook/callback",
      authorizationURL: `https://login.microsoftonline.com/${process.env.OAUTH_TENANT_ID || 'your-tenant-id'}/oauth2/v2.0/authorize`,
      tokenURL: `https://login.microsoftonline.com/${process.env.OAUTH_TENANT_ID || 'your-tenant-id'}/oauth2/v2.0/token`,
      scope:"https://graph.microsoft.com/.default",
      response_mode:"query"
    },
  };
  