const UserService = require('./UserService');
const { handleError } = require('../../core/utils/ErrorHandler');
const OutlookOAuth = require('../../services/outlook/OutlookOAuth');


class UserController {
  static async createAccount(req, res) {
    try {
      const { email, password } = req.body;
      const user = await UserService.createUserAccount(email, password);
      res.status(201).json({ message: 'Account created successfully', user });
    } catch (error) {
      handleError(error, 'Error creating user account');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }


  static async getUserInfo(req, res) {
    try {
      const { userId } = req.params;
      const user = await UserService.getUserDetails(userId);
      res.status(200).json({ user });
    } catch (error) {
      handleError(error, 'Error fetching user details');
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  static async initiateOutlookAuth(req, res) {
    try {
      // Generate state parameter for security
      const state = Math.random().toString(36).substring(7);

      // Store state in session or cookie for verification
      req.session.oauthState = state;

      // Generate authorization URL
      const authUrl = OutlookOAuth.getAuthUrl(state);
      // Redirect user to Microsoft login
      res.redirect(authUrl);
    } catch (error) {
      handleError(error, 'Error initiating Outlook authentication');
      res.redirect('/error?message=auth_initiation_failed');
    }
  }
  static async handleOutlookCallback(req, res) {
    try {

      const { code, state, error } = req.query;
      const  userId = "JUqi-ZMBgFNgVIFWTTxx";
      const tokenData = await UserService.linkOutlookAccount(userId, code);

      res.redirect('/settings?message=outlook_linked');
    } catch (error) {
      handleError(error, 'Error handling Outlook callback');
      res.redirect('/settings?error=outlook_link_failed');
    }
  }
}
module.exports = UserController;
