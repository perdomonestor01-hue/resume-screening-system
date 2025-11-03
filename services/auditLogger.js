const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Audit Logger Service
 * Tracks all user actions for accountability and compliance
 */
class AuditLogger {
  constructor() {
    this.db = new sqlite3.Database(path.join(__dirname, '..', 'database.db'));
  }

  /**
   * Log a user action to the audit trail
   *
   * @param {Object} options - Logging options
   * @param {Object} options.req - Express request object (for session, IP, user agent)
   * @param {string} options.actionType - Type of action (LOGIN, CREATE_JOB, UPDATE_JOB, DELETE_JOB, VIEW_CANDIDATE, etc.)
   * @param {string} options.resourceType - Type of resource (user, job, candidate, etc.)
   * @param {number} options.resourceId - ID of the affected resource
   * @param {string} options.details - Optional description of the action
   * @param {Object} options.beforeValue - Optional snapshot of resource before change (for updates/deletes)
   * @param {Object} options.afterValue - Optional snapshot of resource after change (for updates)
   */
  async log({ req, actionType, resourceType, resourceId, details, beforeValue, afterValue }) {
    try {
      const userId = req.session?.userId || null;
      const userEmail = req.session?.userEmail || null;
      const ipAddress = this.getClientIp(req);
      const userAgent = req.headers['user-agent'] || null;

      // Convert objects to JSON strings
      const beforeJson = beforeValue ? JSON.stringify(beforeValue) : null;
      const afterJson = afterValue ? JSON.stringify(afterValue) : null;

      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO audit_logs (
            user_id, user_email, action_type, resource_type, resource_id,
            details, before_value, after_value, ip_address, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, userEmail, actionType, resourceType, resourceId, details, beforeJson, afterJson, ipAddress, userAgent],
          (err) => {
            if (err) {
              console.error('Audit logging error:', err);
              // Don't reject - we don't want audit logging to break the main flow
              resolve({ success: false, error: err.message });
            } else {
              resolve({ success: true });
            }
          }
        );
      });
    } catch (error) {
      console.error('Unexpected audit logging error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the client's IP address from the request
   * Handles proxies and load balancers
   */
  getClientIp(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Quick logging methods for common actions
   */
  async logLogin(req, success, userId, userEmail) {
    return this.log({
      req,
      actionType: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      resourceType: 'user',
      resourceId: userId,
      details: success ? `User ${userEmail} logged in` : `Failed login attempt for ${userEmail}`
    });
  }

  async logLogout(req) {
    return this.log({
      req,
      actionType: 'LOGOUT',
      resourceType: 'user',
      resourceId: req.session?.userId,
      details: `User ${req.session?.userEmail} logged out`
    });
  }

  async logJobCreate(req, jobId, jobData) {
    return this.log({
      req,
      actionType: 'CREATE_JOB',
      resourceType: 'job',
      resourceId: jobId,
      details: `Created job: ${jobData.title}`,
      afterValue: jobData
    });
  }

  async logJobUpdate(req, jobId, beforeData, afterData) {
    return this.log({
      req,
      actionType: 'UPDATE_JOB',
      resourceType: 'job',
      resourceId: jobId,
      details: `Updated job: ${afterData.title || beforeData.title}`,
      beforeValue: beforeData,
      afterValue: afterData
    });
  }

  async logJobDelete(req, jobId, jobData) {
    return this.log({
      req,
      actionType: 'DELETE_JOB',
      resourceType: 'job',
      resourceId: jobId,
      details: `Deleted job: ${jobData.title}`,
      beforeValue: jobData
    });
  }

  async logCandidateView(req, candidateId, candidateName) {
    return this.log({
      req,
      actionType: 'VIEW_CANDIDATE',
      resourceType: 'candidate',
      resourceId: candidateId,
      details: `Viewed candidate: ${candidateName || `ID ${candidateId}`}`
    });
  }

  async logResumeUpload(req, candidateId, candidateName, source) {
    return this.log({
      req,
      actionType: 'UPLOAD_RESUME',
      resourceType: 'candidate',
      resourceId: candidateId,
      details: `Resume uploaded for ${candidateName || 'candidate'} via ${source}`
    });
  }

  /**
   * Get audit logs with optional filters
   */
  async getAuditLogs({ userId, actionType, resourceType, resourceId, limit = 100, offset = 0 }) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM audit_logs WHERE 1=1';
      const params = [];

      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }
      if (actionType) {
        query += ' AND action_type = ?';
        params.push(actionType);
      }
      if (resourceType) {
        query += ' AND resource_type = ?';
        params.push(resourceType);
      }
      if (resourceId) {
        query += ' AND resource_id = ?';
        params.push(resourceId);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON strings back to objects
          const logs = rows.map(row => ({
            ...row,
            before_value: row.before_value ? JSON.parse(row.before_value) : null,
            after_value: row.after_value ? JSON.parse(row.after_value) : null
          }));
          resolve(logs);
        }
      });
    });
  }

  /**
   * Get audit log statistics
   */
  async getAuditStats() {
    return new Promise((resolve, reject) => {
      const stats = {};

      this.db.get('SELECT COUNT(*) as total FROM audit_logs', (err, row) => {
        stats.total_logs = row.total;

        this.db.get('SELECT COUNT(DISTINCT user_id) as total FROM audit_logs WHERE user_id IS NOT NULL', (err, row) => {
          stats.active_users = row.total;

          this.db.get(`
            SELECT action_type, COUNT(*) as count
            FROM audit_logs
            GROUP BY action_type
            ORDER BY count DESC
            LIMIT 5
          `, [], (err, rows) => {
            this.db.all(`
              SELECT action_type, COUNT(*) as count
              FROM audit_logs
              GROUP BY action_type
              ORDER BY count DESC
              LIMIT 5
            `, [], (err, rows) => {
              stats.top_actions = rows;
              resolve(stats);
            });
          });
        });
      });
    });
  }
}

module.exports = new AuditLogger();
