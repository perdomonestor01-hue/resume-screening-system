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
  async sendCandidateNotification(candidate, job, comparison, distanceInfo = null) {
    if (!this.initialized) {
      console.log('Email notifications not configured - skipping notification');
      return { sent: false, reason: 'Not configured' };
    }

    try {
      const threshold = parseInt(process.env.NOTIFICATION_THRESHOLD) || 70;

      if (comparison.match_score < threshold) {
        return { sent: false, reason: 'Below threshold' };
      }

      const emailHtml = this.buildNotificationEmail(candidate, job, comparison, distanceInfo);

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
  buildNotificationEmail(candidate, job, comparison, distanceInfo = null) {
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
    .distance-section { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
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

      ${distanceInfo && distanceInfo.success ? `
      <div class="distance-section">
        <h2 style="margin-top: 0; color: #1e40af; font-size: 16px;">🚗 Distance to Workplace</h2>
        <div class="info-row"><span class="label">Distance:</span> <strong>${distanceInfo.distance_miles} miles</strong> (${distanceInfo.distance_km} km)</div>
        <div class="info-row"><span class="label">Estimated Drive Time:</span> ~${Math.round(distanceInfo.distance_miles * 1.5)} minutes</div>
        <div class="info-row"><span class="label">Commute Assessment:</span> ${distanceInfo.commute_description}</div>
      </div>
      ` : ''}

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

  /**
   * Send summary alert to safety coordinator with all high matches
   */
  async sendSafetyCoordinatorAlert(candidate, highMatches) {
    if (!this.initialized) {
      console.log('Email notifications not configured - skipping safety coordinator alert');
      return { sent: false, reason: 'Not configured' };
    }

    if (!highMatches || highMatches.length === 0) {
      return { sent: false, reason: 'No high matches' };
    }

    try {
      const emailHtml = this.buildSafetyCoordinatorEmail(candidate, highMatches);
      const matchSummary = highMatches.map(m => `${m.job_title} (${m.match_score}%)`).join(', ');

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER || 'airecruiter@customworkforcesolutionsllc.com',
        to: process.env.NOTIFICATION_TO || 'safety@customworkforcesolutionsllc.com,airecruiter@customworkforcesolutionsllc.com',
        subject: `🎯 Great Match Alert: "${candidate.name}" is a strong candidate`,
        html: emailHtml
      });

      console.log(`✓ Safety coordinator alert sent for ${candidate.name}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending safety coordinator alert:', error);
      return { sent: false, error: error.message };
    }
  }

  /**
   * Build HTML email for safety coordinator
   */
  buildSafetyCoordinatorEmail(candidate, highMatches) {
    const topMatch = highMatches[0];
    const matchListHtml = highMatches.map(match => {
      const scoreColor = this.getScoreColor(match.match_score);
      return `
        <div style="background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border-left: 5px solid ${scoreColor};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px;">${match.job_title}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">
                ${match.job.sector || ''} ${match.job.job_type ? `• ${match.job.job_type}` : ''}
                ${match.distance_info?.distance_miles ? `• ${match.distance_info.distance_miles} miles from candidate` : ''}
              </p>
            </div>
            <div style="background: ${scoreColor}; color: white; padding: 15px 25px; border-radius: 50px; font-size: 24px; font-weight: bold;">
              ${match.match_score}%
            </div>
          </div>
          ${match.strengths ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <strong style="color: #10b981;">✅ Key Strengths:</strong>
            ${this.formatBulletPoints(match.strengths)}
          </div>
          ` : ''}
          ${match.gaps ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <strong style="color: #f59e0b;">⚠️ Potential Gaps:</strong>
            ${this.formatBulletPoints(match.gaps)}
          </div>
          ` : ''}
          ${match.recommendations ? `
          <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <strong style="color: #3b82f6;">💡 Recommendations:</strong>
            ${this.formatBulletPoints(match.recommendations)}
          </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #A4C4DE 0%, #8AAFE0 100%); color: #000; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 30px; background: #f9fafb; }
    .candidate-info { background: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .candidate-info h2 { margin: 0 0 15px 0; color: #1f2937; font-size: 22px; }
    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #6b7280; width: 120px; flex-shrink: 0; }
    .info-value { color: #111827; flex: 1; }
    .matches-section h2 { color: #1f2937; font-size: 20px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #A4C4DE; }
    .footer { text-align: center; padding: 30px; background: #f3f4f6; color: #6b7280; font-size: 13px; }
    .btn { display: inline-block; background: #A4C4DE; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    .btn:hover { background: #8AAFE0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Great Match Alert!</h1>
      <p>"${candidate.name}" is a strong candidate for ${highMatches.length} position${highMatches.length > 1 ? 's' : ''}</p>
    </div>

    <div class="content">
      <div class="candidate-info">
        <h2>👤 Candidate Information</h2>
        <div class="info-row">
          <span class="info-label">Name:</span>
          <span class="info-value"><strong>${candidate.name || 'Not provided'}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Email:</span>
          <span class="info-value">${candidate.email || 'Not provided'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone:</span>
          <span class="info-value">${candidate.phone || 'Not provided'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Location:</span>
          <span class="info-value">${candidate.address || 'Not provided'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Submitted:</span>
          <span class="info-value">${new Date(candidate.created_at).toLocaleString()}</span>
        </div>
      </div>

      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="margin: 0 0 15px 0; color: white; font-size: 20px;">📝 Next Step: Complete Your Application</h2>
        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
          Our Team will contact you shortly. In the meantime, please complete the full application on our website.
        </p>
        <a href="https://customworkforcesolutionsllc.jotform.com/form/251553809272056"
           style="display: inline-block; background: white; color: #059669; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          Click Here to Complete Application →
        </a>
      </div>

      <div class="matches-section">
        <h2>📋 Position Matches (${highMatches.length})</h2>
        ${matchListHtml}
      </div>

      <div style="text-align: center; padding: 20px;">
        <a href="http://localhost:${process.env.PORT || 3000}/dashboard.html" class="btn">View Full Details in Dashboard</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>Custom Workforce Solutions</strong></p>
      <p>This is an automated alert from the AI Resume Screening System</p>
      <p>Generated on ${new Date().toLocaleString()}</p>
      <p style="margin-top: 15px;">
        <a href="mailto:airecruiter@customworkforcesolutionsllc.com" style="color: #6b7280;">airecruiter@customworkforcesolutionsllc.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send confirmation email to candidate
   * - High matches (75%+): Show positions and Jotform link
   * - Low matches (<75%): Polite rejection with encouragement to check back
   */
  async sendCandidateConfirmationEmail(candidate, comparisonResults) {
    if (!this.initialized) {
      console.log('Email notifications not configured - skipping candidate confirmation');
      return { sent: false, reason: 'Not configured' };
    }

    if (!candidate.email) {
      console.log('Candidate has no email address - skipping confirmation');
      return { sent: false, reason: 'No email address' };
    }

    try {
      const threshold = parseInt(process.env.NOTIFICATION_THRESHOLD) || 75;

      // Filter high matches
      const highMatches = comparisonResults
        .filter(({ comparison }) => comparison.success && comparison.match_score >= threshold)
        .map(({ job, comparison, distanceInfo }) => ({
          job_title: job.title,
          job,
          match_score: comparison.match_score,
          distance_info: distanceInfo
        }));

      const isHighMatch = highMatches.length > 0;
      const emailHtml = isHighMatch
        ? this.buildCandidateHighMatchEmail(candidate, highMatches)
        : this.buildCandidateLowMatchEmail(candidate);

      // FOR TESTING: Send to test email instead of candidate
      const recipientEmail = process.env.CANDIDATE_EMAIL_TEST || candidate.email;

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_USER || 'airecruiter@customworkforcesolutionsllc.com',
        to: recipientEmail,
        subject: 'Thank You for Your Application - Custom Workforce Solutions',
        html: emailHtml
      });

      console.log(`✓ Candidate confirmation sent to ${recipientEmail}: ${info.messageId}`);
      return { sent: true, messageId: info.messageId, highMatch: isHighMatch };
    } catch (error) {
      console.error('Error sending candidate confirmation:', error);
      return { sent: false, error: error.message };
    }
  }

  /**
   * Build email for high-match candidates (75%+)
   */
  buildCandidateHighMatchEmail(candidate, highMatches) {
    const matchListHtml = highMatches.map(match => {
      const scoreColor = this.getScoreColor(match.match_score);
      return `
        <div style="background: #f9fafb; padding: 20px; margin-bottom: 15px; border-radius: 8px; border-left: 5px solid ${scoreColor};">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">${match.job_title}</h3>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                ${match.job.experience_level || 'Various experience levels'}
                ${match.distance_info?.distance_miles ? ` • ${match.distance_info.distance_miles} miles from you` : ''}
              </p>
            </div>
            <div style="background: ${scoreColor}; color: white; padding: 12px 20px; border-radius: 50px; font-size: 20px; font-weight: bold; margin-left: 15px;">
              ${match.match_score}%
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #1f2937; font-size: 20px; margin: 0 0 15px 0; }
    .cta-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0; }
    .cta-box h2 { margin: 0 0 15px 0; color: white; font-size: 22px; }
    .cta-box p { margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; }
    .btn { display: inline-block; background: white; color: #059669; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .btn:hover { background: #f0fdf4; }
    .footer { text-align: center; padding: 30px; background: #f9fafb; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
    .company-name { font-weight: bold; color: #1f2937; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Great News, ${candidate.name || 'Candidate'}!</h1>
      <p>You're a strong match for ${highMatches.length} position${highMatches.length > 1 ? 's' : ''}</p>
    </div>

    <div class="content">
      <div class="greeting">
        <p>Dear ${candidate.name || 'Applicant'},</p>
        <p style="margin-top: 15px;">Thank you for submitting your application to <span class="company-name">Custom Workforce Solutions</span>. We've reviewed your qualifications and are pleased to inform you that your profile is an excellent match for the following position${highMatches.length > 1 ? 's' : ''}:</p>
      </div>

      <div class="section">
        <h2>📋 Your Matching Positions</h2>
        ${matchListHtml}
      </div>

      <div class="cta-box">
        <h2>📝 Next Step: Complete Your Application</h2>
        <p>Our team will contact you shortly to discuss these opportunities. In the meantime, please complete the full application to expedite the process.</p>
        <a href="https://customworkforcesolutionsllc.jotform.com/form/251553809272056" class="btn">
          Complete Application Now →
        </a>
      </div>

      <div class="section">
        <p style="color: #6b7280; font-size: 14px; line-height: 1.8;">
          <strong>What happens next?</strong><br>
          1. Complete the application form using the link above<br>
          2. Our recruitment team will review your complete profile<br>
          3. We'll contact you within 2-3 business days to schedule an interview<br>
        </p>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>⏰ Important:</strong> Please complete your application within 48 hours to maintain priority consideration for these positions.
        </p>
      </div>
    </div>

    <div class="footer">
      <p class="company-name">Custom Workforce Solutions</p>
      <p style="margin: 10px 0;">Connecting great talent with great opportunities</p>
      <p style="margin-top: 15px;">
        Questions? Contact us at <a href="mailto:airecruiter@customworkforcesolutionsllc.com" style="color: #667eea;">airecruiter@customworkforcesolutionsllc.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Build email for low-match candidates (below 75%)
   */
  buildCandidateLowMatchEmail(candidate) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f3f4f6; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
    .section { margin-bottom: 25px; }
    .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .info-box p { margin: 0; color: #1e40af; line-height: 1.8; }
    .footer { text-align: center; padding: 30px; background: #f9fafb; color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; }
    .company-name { font-weight: bold; color: #1f2937; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Your Application</h1>
      <p>Custom Workforce Solutions</p>
    </div>

    <div class="content">
      <div class="greeting">
        <p>Dear ${candidate.name || 'Applicant'},</p>
      </div>

      <div class="section">
        <p style="line-height: 1.8;">Thank you for submitting your application to <span class="company-name">Custom Workforce Solutions</span>. We appreciate your interest in joining our team and the time you took to apply.</p>
      </div>

      <div class="section">
        <p style="line-height: 1.8;">After carefully reviewing your qualifications, we regret to inform you that <strong>at the moment we have no positions available</strong> that match your current experience and skill set.</p>
      </div>

      <div class="info-box">
        <p><strong>🔄 We encourage you to keep checking our website continuously!</strong></p>
        <p style="margin-top: 10px;">New opportunities are posted regularly, and your qualifications may be a perfect fit for upcoming positions. We recommend checking back weekly to see what's coming.</p>
      </div>

      <div class="section">
        <p style="line-height: 1.8;">We will keep your application on file for <strong>90 days</strong>. If a suitable position becomes available during this time, we will reach out to you directly.</p>
      </div>

      <div class="section" style="margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; line-height: 1.8;">
          <strong>Tips for future applications:</strong><br>
          • Visit our careers page regularly for new openings<br>
          • Consider updating your resume to highlight relevant manufacturing skills<br>
          • Check out our training programs and certifications we value<br>
        </p>
      </div>

      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <p style="margin: 0; color: #065f46; font-size: 14px;">
          <strong>💡 Stay Connected:</strong> Follow us on social media to be the first to know about new job openings and company updates.
        </p>
      </div>
    </div>

    <div class="footer">
      <p class="company-name">Custom Workforce Solutions</p>
      <p style="margin: 10px 0;">Connecting great talent with great opportunities</p>
      <p style="margin-top: 15px;">
        Questions? Contact us at <a href="mailto:airecruiter@customworkforcesolutionsllc.com" style="color: #667eea;">airecruiter@customworkforcesolutionsllc.com</a>
      </p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new Notifier();
