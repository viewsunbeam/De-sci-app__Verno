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

      // 如果提供了userId但用户不存在，则将userId设为null以避免外键约束错误
      let validUserId = userId;
      if (userId) {
        try {
          const userExists = await db.getAsync('SELECT id FROM users WHERE id = ?', [userId]);
          if (!userExists) {
            console.warn(`User ID ${userId} not found, logging without user reference`);
            validUserId = null;
          }
        } catch (err) {
          console.warn('Error checking user existence, logging without user reference:', err.message);
          validUserId = null;
        }
      }

      await db.runAsync(`
        INSERT INTO activity_logs (
          user_id, username, wallet_address, action_type, resource_type,
          resource_id, resource_name, action_description, metadata,
          ip_address, user_agent, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        validUserId, username, walletAddress, actionType, resourceType,
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

  // 项目删除记录
  static async logProjectDeleted(userId, username, projectId, projectName, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.warning({
      userId,
      username,
      actionType: 'delete_project',
      resourceType: 'project',
      resourceId: projectId,
      resourceName: projectName,
      actionDescription: `项目删除: 删除项目 "${projectName}" (ID: ${projectId})`,
      metadata: {
        project: { id: projectId, name: projectName }
      },
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

  // ==================== 关键操作审计日志 ====================

  // 成员变更记录
  static async logMemberChange(adminUserId, adminUsername, targetUserId, targetUsername, changeType, details, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: adminUserId,
      username: adminUsername,
      actionType: 'member_change',
      resourceType: 'user',
      resourceId: targetUserId,
      resourceName: targetUsername,
      actionDescription: `成员变更: ${changeType} - ${targetUsername}`,
      metadata: {
        changeType,
        details,
        targetUser: { id: targetUserId, username: targetUsername }
      },
      ipAddress,
      userAgent,
      severity: 'info'
    });
  }

  // 权限调整记录
  static async logPermissionChange(adminUserId, adminUsername, targetUserId, targetUsername, oldRole, newRole, reason, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: adminUserId,
      username: adminUsername,
      actionType: 'permission_change',
      resourceType: 'user',
      resourceId: targetUserId,
      resourceName: targetUsername,
      actionDescription: `权限调整: ${targetUsername} 从 "${oldRole}" 变更为 "${newRole}"`,
      metadata: {
        oldRole,
        newRole,
        reason,
        targetUser: { id: targetUserId, username: targetUsername }
      },
      ipAddress,
      userAgent,
      severity: 'warning'
    });
  }

  // 研究者身份验证记录
  static async logResearcherVerification(adminUserId, adminUsername, targetUserId, targetUsername, verified, reason, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: adminUserId,
      username: adminUsername,
      actionType: verified ? 'verify' : 'unverify',
      resourceType: 'researcher',
      resourceId: targetUserId,
      resourceName: targetUsername,
      actionDescription: `研究者身份${verified ? '验证' : '取消验证'}: ${targetUsername}`,
      metadata: {
        verified,
        reason,
        targetUser: { id: targetUserId, username: targetUsername }
      },
      ipAddress,
      userAgent,
      severity: 'info'
    });
  }

  // 论文发布审核记录
  static async logPublicationReview(adminUserId, adminUsername, publicationId, publicationTitle, action, reason, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    const actionMap = {
      'approve': '批准',
      'reject': '拒绝',
      'request_revision': '要求修改'
    };
    return this.log({
      userId: adminUserId,
      username: adminUsername,
      actionType: action,
      resourceType: 'publication',
      resourceId: publicationId,
      resourceName: publicationTitle,
      actionDescription: `论文审核: ${actionMap[action]} "${publicationTitle}"`,
      metadata: {
        action,
        reason
      },
      ipAddress,
      userAgent,
      severity: action === 'reject' ? 'warning' : 'info'
    });
  }

  // 数据集审核记录
  static async logDatasetReview(adminUserId, adminUsername, datasetId, datasetName, action, reason, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    const actionMap = {
      'approve': '批准',
      'reject': '拒绝',
      'request_revision': '要求修改'
    };
    return this.log({
      userId: adminUserId,
      username: adminUsername,
      actionType: action,
      resourceType: 'dataset',
      resourceId: datasetId,
      resourceName: datasetName,
      actionDescription: `数据集审核: ${actionMap[action]} "${datasetName}"`,
      metadata: {
        action,
        reason
      },
      ipAddress,
      userAgent,
      severity: action === 'reject' ? 'warning' : 'info'
    });
  }

  // 评审员分配记录
  static async logReviewerAssignment(adminUserId, adminUsername, reviewerId, reviewerUsername, publicationId, publicationTitle, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: adminUserId,
      username: adminUsername,
      actionType: 'assign_reviewer',
      resourceType: 'review',
      resourceId: publicationId,
      resourceName: publicationTitle,
      actionDescription: `评审员分配: 为论文 "${publicationTitle}" 分配评审员 "${reviewerUsername}"`,
      metadata: {
        reviewer: { id: reviewerId, username: reviewerUsername },
        publication: { id: publicationId, title: publicationTitle }
      },
      ipAddress,
      userAgent,
      severity: 'info'
    });
  }

  // 系统配置变更记录
  static async logSystemConfigChange(adminUserId, adminUsername, configKey, oldValue, newValue, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: adminUserId,
      username: adminUsername,
      actionType: 'config_change',
      resourceType: 'system',
      resourceName: configKey,
      actionDescription: `系统配置变更: "${configKey}" 从 "${oldValue}" 变更为 "${newValue}"`,
      metadata: {
        configKey,
        oldValue,
        newValue
      },
      ipAddress,
      userAgent,
      severity: 'warning'
    });
  }

  // 数据集权限授予记录
  static async logDatasetPermissionGranted(granterId, granterUsername, targetWalletAddress, targetUsername, datasetId, datasetName, permissionType, expiresAt, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: granterId,
      username: granterUsername,
      actionType: 'grant_permission',
      resourceType: 'dataset',
      resourceId: datasetId,
      resourceName: datasetName,
      actionDescription: `数据集权限授予: 为用户 "${targetUsername || targetWalletAddress}" 授予数据集 "${datasetName}" 的 "${permissionType}" 权限`,
      metadata: {
        targetWalletAddress,
        targetUsername,
        permissionType,
        expiresAt,
        dataset: { id: datasetId, name: datasetName }
      },
      ipAddress,
      userAgent,
      severity: 'info'
    });
  }

  // 数据集权限撤销记录
  static async logDatasetPermissionRevoked(revokerId, revokerUsername, targetWalletAddress, targetUsername, datasetId, datasetName, permissionType, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: revokerId,
      username: revokerUsername,
      actionType: 'revoke_permission',
      resourceType: 'dataset',
      resourceId: datasetId,
      resourceName: datasetName,
      actionDescription: `数据集权限撤销: 撤销用户 "${targetUsername || targetWalletAddress}" 对数据集 "${datasetName}" 的 "${permissionType}" 权限`,
      metadata: {
        targetWalletAddress,
        targetUsername,
        permissionType,
        dataset: { id: datasetId, name: datasetName }
      },
      ipAddress,
      userAgent,
      severity: 'warning'
    });
  }

  // 项目协作者添加记录
  static async logProjectCollaboratorAdded(adderId, adderUsername, targetWalletAddress, targetUsername, projectId, projectName, role, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: adderId,
      username: adderUsername,
      actionType: 'add_collaborator',
      resourceType: 'project',
      resourceId: projectId,
      resourceName: projectName,
      actionDescription: `项目协作者添加: 将用户 "${targetUsername || targetWalletAddress}" 添加为项目 "${projectName}" 的 "${role}" 角色`,
      metadata: {
        targetWalletAddress,
        targetUsername,
        role,
        project: { id: projectId, name: projectName }
      },
      ipAddress,
      userAgent,
      severity: 'info'
    });
  }

  // 项目协作者移除记录
  static async logProjectCollaboratorRemoved(removerId, removerUsername, targetWalletAddress, targetUsername, projectId, projectName, role, req) {
    const { ipAddress, userAgent } = this.extractUserInfo(req);
    return this.log({
      userId: removerId,
      username: removerUsername,
      actionType: 'remove_collaborator',
      resourceType: 'project',
      resourceId: projectId,
      resourceName: projectName,
      actionDescription: `项目协作者移除: 将用户 "${targetUsername || targetWalletAddress}" 从项目 "${projectName}" 的 "${role}" 角色中移除`,
      metadata: {
        targetWalletAddress,
        targetUsername,
        role,
        project: { id: projectId, name: projectName }
      },
      ipAddress,
      userAgent,
      severity: 'warning'
    });
  }
}

module.exports = ActivityLogger;