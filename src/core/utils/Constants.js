const Constants = {
    EMAIL_STATUSES: {
      READ: "read",
      UNREAD: "unread",
      FLAGGED: "flagged",
      DELETED: "deleted",
    },
    OAUTH: {
      CALLBACK_URL: process.env.OAUTH_CALLBACK_URL || "http://localhost:3000/callback",
    },
    API_RESPONSE_MESSAGES: {
      SUCCESS: "Operation completed successfully.",
      FAIL: "An error occurred during the operation.",
      NOT_FOUND: "Requested resource not found.",
    },
  };
  
  module.exports = Constants;
  