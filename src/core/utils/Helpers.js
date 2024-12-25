const crypto = require("crypto");

const Helpers = {
  generateUUID: () => {
    return crypto.randomUUID();
  },

  delay: (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  formatResponse: (data, message = "Success") => {
    return {
      success: true,
      message,
      data,
    };
  },

  isEmailValid: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },
};

module.exports = Helpers;
