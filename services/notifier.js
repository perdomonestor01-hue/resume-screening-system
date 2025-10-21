const nodemailer = require('nodemailer');

/**
 * Email Notification Service
 * Sends email alerts for high-match candidates
 */
class Notifier {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize email transporter
   */
  async init() {
    if (this.initialized) return;

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      // Verify connection
      await this.transporter.verify();
      this.initialized = true;
      console.log('✓ Email notification service initialized');
    } catch (error) {
      console.error('Email notification service initialization failed:', error.message);
      console.log('Email notifications will be disabled. Check your SMTP settings in .env file.');
    }
  }

  /**
   * Send notification for a high-match candidate
   */
  async sendCandidateNotification(candidate, job, comparison) {
    if (!this.initialized) {
      console.log('Email notifications not configured - skipping notification');
      return { sent: false, reason: 'Not configured' };
    }

    try {
      const threshold = parseInt(process.env.NOTIFICATION_THRESHOLD) || 70;

      if (comparison.match_score < threshold) {
        return { sent: false, reason: 'Below threshold' };
      }

      const emailHtml = this.buildNotificationEmail(candidate, job, comparison);

      const info = await this.transporter.sendMail({
        from: process.env.NOTIFICATION_FROM,
        to: process.env.NOTIFICATION_TO,
        subject: `🎯 High-Match Candidate Alert: ${candidate.name || 'New Applicant'} - ${comparison.match_score}% match`,
        html: emailHtml
      });

      console.log(`✓ Notification sent for candidate ${candidate.id}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { sent: false, error: error.message };
    }
  }

  /**
   * Build HTML email for notification
   */
  buildNotificationEmail(candidate, job, comparison) {
    const scoreColor = this.getScoreColor(comparison.match_score);
    const scoreLevel = this.getScoreLevel(comparison.match_score);

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .score-badge { background: ${scoreColor}; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; font-size: 20px; font-weight: bold; margin-top: 10px; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .section h2 { margin-top: 0; color: #667eea; font-size: 18px; }
    .info-row { margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .strengths { color: #10b981; }
    .gaps { color: #ef4444; }
    ul { margin: 10px 0; padding-left: 20px; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    .btn { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 High-Match Candidate Alert</h1>
      <div class="score-badge">${comparison.match_score}% Match - ${scoreLevel}</div>
    </div>

    <div class="content">
      <div class="section">
        <h2>📋 Candidate Information</h2>
        <div class="info-row"><span class="label">Name:</span> ${candidate.name || 'Not provided'}</div>
        <div class="info-row"><span class="label">Email:</span> ${candidate.email || 'Not provided'}</div>
        <div class="info-row"><span class="label">Phone:</span> ${candidate.phone || 'Not provided'}</div>
        <div class="info-row"><span class="label">Source:</span> ${candidate.source === 'email' ? 'Email Submission' : 'Web Upload'}</div>
        <div class="info-row"><span class="label">Applied:</span> ${new Date(candidate.created_at).toLocaleDateString()}</div>
      </div>

      <div class="section">
        <h2>💼 Position Applied For</h2>
        <div class="info-row"><span class="label">Title:</span> ${job.title}</div>
        <div class="info-row"><span class="label">Experience Level:</span> ${job.experience_level || 'Not specified'}</div>
      </div>

      <div class="section">
        <h2 class="strengths">✅ Key Strengths</h2>
        ${this.formatBulletPoints(comparison.strengths)}
      </div>

      <div class="section">
        <h2 class="gaps">⚠️ Potential Gaps</h2>
        ${this.formatBulletPoints(comparison.gaps)}
      </div>

      <div class="section">
        <h2>💡 Recommendations</h2>
        ${this.formatBulletPoints(comparison.recommendations)}
      </div>

      ${comparison.detailed_analysis ? `
      <div class="section">
        <h2>📊 Executive Summary</h2>
        <p>${comparison.detailed_analysis}</p>
      </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="http://localhost:${process.env.PORT || 3000}/dashboard.html" class="btn">View Full Details</a>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated notification from the Resume Screening System</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Format bullet points from text
   */
  formatBulletPoints(text) {
    if (!text) return '<p>No information available</p>';

    // If text already has bullet points or dashes, convert to HTML list
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.some(line => line.trim().match(/^[-•*]/))) {
      const items = lines.map(line => {
        const cleaned = line.trim().replace(/^[-•*]\s*/, '');
        return `<li>${cleaned}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    }

    // Otherwise just return as paragraphs
    return lines.map(line => `<p>${line}</p>`).join('');
  }

  /**
   * Get color based on score
   */
  getScoreColor(score) {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#6366f1';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  }

  /**
   * Get level based on score
   */
  getScoreLevel(score) {
    if (score >= 90) return 'Exceptional';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    return 'Poor';
  }
}

module.exports = new Notifier();
