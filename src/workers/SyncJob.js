const { SyncService } = require('../modules/Sync/SyncService');
const { logger } = require('../utils/Logger');

class SyncJob {
  constructor() {
    this.syncService = new SyncService();
  }

  // Job to synchronize emails
  async run() {
    try {
      logger.info('SyncJob started.');
      // Sync emails from the selected service (Outlook/Yahoo, etc.)
      const syncStatus = await this.syncService.syncEmail();
      logger.info('SyncJob completed successfully', syncStatus);
    } catch (error) {
      logger.error('SyncJob failed', error);
    }
  }

  // Job to monitor synchronization status (could be triggered periodically)
  async checkSyncStatus() {
    try {
      const status = await this.syncService.getSyncStatus();
      logger.info('Sync status:', status);
    } catch (error) {
      logger.error('Failed to check sync status', error);
    }
  }
}

module.exports = SyncJob;
