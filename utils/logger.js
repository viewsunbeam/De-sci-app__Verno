const db = require('../database');

class ActivityLogger {
  static async log({
    userId = null,
    username = null,
    walletAddress = null,
    actionType,
    resourceType,
    resourceId = null,
    resourceName = null,
    actionDescription,
    metadata = null,
    ipAddress = null,
    userAgent = null,
    severity = 'info'
  }) {
    try {
      const metadataString = metadata ? JSON.stringify(metadata) : null;

      await db.runAsync(`
        INSERT INTO activity_logs (
          user_id, username, wallet_address, action_type, resource_type,
          resource_id, resource_name, action_description, metadata,
          ip_address, user_agent, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, username, walletAddress, actionType, resourceType,
        resourceId, resourceName, actionDescription, metadataString,
        ipAddress, userAgent, severity
      ]);

      console.log(`[${severity.toUpperCase()}] ${actionType} ${resourceType}: ${actionDescription}`);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Convenience methods for different log levels
  static async info(params) {
    return this.log({ ...params, severity: 'info' });
  }

  static async success(params) {
    return this.log({ ...params, severity: 'success' });
  }

  static async warning(params) {
    return this.log({ ...params, severity: 'warning' });
  }

  static async error(params) {
    return this.log({ ...params, severity: 'error' });
  }

  // Helper method to extract user info from request
  static extractUserInfo(req) {
    return {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      // Add more extraction logic based on your auth system
    };
  }

  // Predefined log types for common actions
  static async logUserLogin(userId, username, walletAddress, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.success({
      userId,
      username,
      walletAddress,
      actionType: 'login',
      resourceType: 'user',
      resourceId: userId,
      resourceName: username,
      actionDescription: `User ${username} logged in`,
      ipAddress,
      userAgent
    });
  }

  static async logProjectCreated(userId, username, projectId, projectName, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.success({
      userId,
      username,
      actionType: 'create',
      resourceType: 'project',
      resourceId: projectId,
      resourceName: projectName,
      actionDescription: `Created project "${projectName}"`,
      ipAddress,
      userAgent
    });
  }

  static async logDatasetUploaded(userId, username, datasetId, datasetName, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.success({
      userId,
      username,
      actionType: 'upload',
      resourceType: 'dataset',
      resourceId: datasetId,
      resourceName: datasetName,
      actionDescription: `Uploaded dataset "${datasetName}"`,
      ipAddress,
      userAgent
    });
  }

  static async logNFTMinted(userId, username, nftId, nftTitle, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.success({
      userId,
      username,
      actionType: 'mint',
      resourceType: 'nft',
      resourceId: nftId,
      resourceName: nftTitle,
      actionDescription: `Minted NFT "${nftTitle}"`,
      ipAddress,
      userAgent
    });
  }

  static async logReviewSubmitted(userId, username, reviewId, paperTitle, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.success({
      userId,
      username,
      actionType: 'submit',
      resourceType: 'review',
      resourceId: reviewId,
      resourceName: paperTitle,
      actionDescription: `Submitted review for "${paperTitle}"`,
      ipAddress,
      userAgent
    });
  }

  static async logError(actionType, resourceType, errorMessage, req, metadata = null) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.error({
      actionType,
      resourceType,
      actionDescription: `Error: ${errorMessage}`,
      metadata,
      ipAddress,
      userAgent
    });
  }
}

module.exports = ActivityLogger;