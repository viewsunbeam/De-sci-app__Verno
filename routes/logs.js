const express = require('express');
const router = express.Router();
const db = require('../database');

// Get activity logs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity = null,
      actionType = null,
      resourceType = null,
      userId = null,
      startDate = null,
      endDate = null,
      search = null
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    // Build WHERE conditions
    if (severity) {
      whereConditions.push('severity = ?');
      params.push(severity);
    }

    if (actionType) {
      whereConditions.push('action_type = ?');
      params.push(actionType);
    }

    if (resourceType) {
      whereConditions.push('resource_type = ?');
      params.push(resourceType);
    }

    if (userId) {
      whereConditions.push('user_id = ?');
      params.push(userId);
    }

    if (startDate) {
      whereConditions.push('timestamp >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('timestamp <= ?');
      params.push(endDate);
    }

    if (search) {
      whereConditions.push(`(
        action_description LIKE ? OR
        resource_name LIKE ? OR
        username LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`;
    const countResult = await db.getAsync(countQuery, params);
    const total = countResult.total;

    // Get logs
    const logsQuery = `
      SELECT
        id,
        user_id,
        username,
        wallet_address,
        action_type,
        resource_type,
        resource_id,
        resource_name,
        action_description,
        metadata,
        ip_address,
        user_agent,
        timestamp,
        severity
      FROM activity_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const logs = await db.allAsync(logsQuery, [...params, parseInt(limit), offset]);

    // Parse metadata for each log
    const formattedLogs = logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      // 数据库存储的是UTC时间，需要正确解析
      timestamp: new Date(log.timestamp + 'Z').toISOString()
    }));

    res.json({
      logs: formattedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Failed to get activity logs:', error);
    res.status(500).json({ error: 'Failed to get activity logs' });
  }
});

// Get log statistics
router.get('/stats', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    let timeCondition = '';
    switch (timeRange) {
      case '1h':
        timeCondition = "timestamp >= datetime('now', '-1 hour')";
        break;
      case '24h':
        timeCondition = "timestamp >= datetime('now', '-1 day')";
        break;
      case '7d':
        timeCondition = "timestamp >= datetime('now', '-7 days')";
        break;
      case '30d':
        timeCondition = "timestamp >= datetime('now', '-30 days')";
        break;
      default:
        timeCondition = "timestamp >= datetime('now', '-1 day')";
    }

    // Get activity counts by severity
    const severityStats = await db.allAsync(`
      SELECT severity, COUNT(*) as count
      FROM activity_logs
      WHERE ${timeCondition}
      GROUP BY severity
    `);

    // Get activity counts by action type
    const actionStats = await db.allAsync(`
      SELECT action_type, COUNT(*) as count
      FROM activity_logs
      WHERE ${timeCondition}
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get activity counts by resource type
    const resourceStats = await db.allAsync(`
      SELECT resource_type, COUNT(*) as count
      FROM activity_logs
      WHERE ${timeCondition}
      GROUP BY resource_type
      ORDER BY count DESC
    `);

    // Get hourly activity for the last 24 hours
    const hourlyActivity = await db.allAsync(`
      SELECT
        strftime('%H', timestamp) as hour,
        COUNT(*) as count
      FROM activity_logs
      WHERE timestamp >= datetime('now', '-24 hours')
      GROUP BY strftime('%H', timestamp)
      ORDER BY hour
    `);

    // Get most active users
    const activeUsers = await db.allAsync(`
      SELECT
        username,
        COUNT(*) as activity_count
      FROM activity_logs
      WHERE ${timeCondition} AND username IS NOT NULL
      GROUP BY username
      ORDER BY activity_count DESC
      LIMIT 10
    `);

    res.json({
      timeRange,
      severityStats,
      actionStats,
      resourceStats,
      hourlyActivity,
      activeUsers
    });

  } catch (error) {
    console.error('Failed to get log statistics:', error);
    res.status(500).json({ error: 'Failed to get log statistics' });
  }
});

// Get recent critical logs (errors and warnings)
router.get('/critical', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const criticalLogs = await db.allAsync(`
      SELECT
        id,
        user_id,
        username,
        action_type,
        resource_type,
        resource_name,
        action_description,
        timestamp,
        severity
      FROM activity_logs
      WHERE severity IN ('error', 'warning')
      ORDER BY timestamp DESC
      LIMIT ?
    `, [parseInt(limit)]);

    const formattedLogs = criticalLogs.map(log => ({
      ...log,
      // 数据库存储的是UTC时间，需要正确解析
      timestamp: new Date(log.timestamp + 'Z').toISOString()
    }));

    res.json(formattedLogs);

  } catch (error) {
    console.error('Failed to get critical logs:', error);
    res.status(500).json({ error: 'Failed to get critical logs' });
  }
});

// Delete old logs (admin only)
router.delete('/cleanup', async (req, res) => {
  try {
    const { olderThan = '30d' } = req.query;

    let dateCondition = '';
    switch (olderThan) {
      case '7d':
        dateCondition = "timestamp < datetime('now', '-7 days')";
        break;
      case '30d':
        dateCondition = "timestamp < datetime('now', '-30 days')";
        break;
      case '90d':
        dateCondition = "timestamp < datetime('now', '-90 days')";
        break;
      case '1y':
        dateCondition = "timestamp < datetime('now', '-1 year')";
        break;
      default:
        dateCondition = "timestamp < datetime('now', '-30 days')";
    }

    const result = await db.runAsync(`
      DELETE FROM activity_logs
      WHERE ${dateCondition}
    `);

    res.json({
      message: 'Log cleanup completed',
      deletedRows: result.changes
    });

  } catch (error) {
    console.error('Failed to cleanup logs:', error);
    res.status(500).json({ error: 'Failed to cleanup logs' });
  }
});

// Export logs to CSV (admin only)
router.get('/export', async (req, res) => {
  try {
    const {
      startDate = null,
      endDate = null,
      format = 'json'
    } = req.query;

    let whereConditions = [];
    let params = [];

    if (startDate) {
      whereConditions.push('timestamp >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push('timestamp <= ?');
      params.push(endDate);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const logs = await db.allAsync(`
      SELECT
        timestamp,
        username,
        action_type,
        resource_type,
        resource_name,
        action_description,
        severity,
        ip_address
      FROM activity_logs
      ${whereClause}
      ORDER BY timestamp DESC
    `, params);

    if (format === 'csv') {
      // Convert to CSV
      const csvHeader = 'Timestamp,Username,Action Type,Resource Type,Resource Name,Description,Severity,IP Address\n';
      const csvRows = logs.map(log =>
        `"${log.timestamp}","${log.username || ''}","${log.action_type}","${log.resource_type}","${log.resource_name || ''}","${log.action_description}","${log.severity}","${log.ip_address || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="activity_logs_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvRows);
    } else {
      res.json(logs);
    }

  } catch (error) {
    console.error('Failed to export logs:', error);
    res.status(500).json({ error: 'Failed to export logs' });
  }
});

module.exports = router;