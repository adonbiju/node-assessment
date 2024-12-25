class EmailService {
  constructor() {
    if (this.constructor === EmailService) {
      throw new Error("Cannot instantiate an abstract class");
    }
  }

  async fetchEmails(options = {}) {
    throw new Error("Method 'fetchEmails()' must be implemented.");
  }

  async verifyTokenAndTenant() {
    throw new Error("Method 'verifyTokenAndTenant()' must be implemented.");
  }

  async getMailFolders() {
    throw new Error("Method 'getMailFolders()' must be implemented.");
  }

  async syncEmailChanges(deltaLink) {
    throw new Error("Method 'syncEmailChanges()' must be implemented.");
  }
}

module.exports = EmailService;
