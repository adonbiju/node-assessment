const UserModel = require('./UserModel');
const OutlookOAuth = require('../../services/outlook/OutlookOAuth');
const { handleError } = require('../../core//utils/ErrorHandler');

class UserService {
  static async createUserAccount(email, password) {
    try {
      // Check if the user already exists
      const existingUser = await UserModel.findUserByEmail(email);
      if (existingUser) throw new Error('User already exists');

      // Create a new user account and save to the database
      const newUser = await UserModel.createUser({ email, password });
      return newUser;
    } catch (error) {
      handleError(error, 'Error in creating user account');
      throw error;
    }
  }

  static async linkOutlookAccount(userId, authCode) {
    try {
      // Get the access token for Outlook account
      const tokenData = await OutlookOAuth.getAccessToken(authCode);

      // Save the access token to the user's profile
      const updatedUser = await UserModel.linkOutlookAccount(userId, tokenData);
      return updatedUser;
    } catch (error) {
      handleError(error, 'Error linking Outlook account');
      throw error;
    }
  }

  static async getUserDetails(userId) {
    try {
      // Fetch user information from the database
      const user = await UserModel.getUserById(userId);
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      handleError(error, 'Error fetching user details');
      throw error;
    }
  }
}

module.exports = UserService;
