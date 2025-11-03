const Imap = require('node-imap');
const { simpleParser } = require('mailparser');
const fs = require('fs').promises;
const path = require('path');

/**
 * Email Monitoring Service
 * Monitors a dedicated email inbox for resume submissions
 */
class EmailMonitor {
  constructor(db, resumeParser, aiComparison, notifier) {
    this.db = db;
    this.resumeParser = resumeParser;
    this.aiComparison = aiComparison;
    this.notifier = notifier;
    this.imap = null;
    this.isMonitoring = false;
    this.checkInterval = null;
  }

  /**
   * Initialize and start email monitoring
   */
  async start() {
    if (!this.validateConfig()) {
      console.log('⚠️  Email monitoring disabled - configuration not complete');
      return;
    }

    try {
      this.imap = new Imap({
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      this.setupEventHandlers();
      this.imap.connect();

      console.log('✓ Email monitoring service started');
      console.log(`  Monitoring: ${process.env.EMAIL_USER}`);
      console.log(`  Check interval: ${(parseInt(process.env.EMAIL_CHECK_INTERVAL) || 60000) / 1000}s`);
    } catch (error) {
      console.error('Error starting email monitor:', error);
    }
  }

  /**
   * Setup IMAP event handlers
   */
  setupEventHandlers() {
    this.imap.once('ready', () => {
      console.log('✓ Connected to email server');
      this.isMonitoring = true;
      this.startPeriodicCheck();
    });

    this.imap.once('error', (err) => {
      console.error('IMAP error:', err);
      this.isMonitoring = false;
    });

    this.imap.once('end', () => {
      console.log('Email connection ended');
      this.isMonitoring = false;
    });
  }

  /**
   * Start periodic email checking
   */
  startPeriodicCheck() {
    const interval = parseInt(process.env.EMAIL_CHECK_INTERVAL) || 60000;

    // Check immediately
    this.checkForNewEmails();

    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkForNewEmails();
    }, interval);
  }

  /**
   * Check for new emails with resume attachments
   */
  async checkForNewEmails() {
    if (!this.imap || !this.isMonitoring) return;

    try {
      this.imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          console.error('Error opening inbox:', err);
          return;
        }

        // Search for unread emails
        this.imap.search(['UNSEEN'], async (err, results) => {
          if (err) {
            console.error('Error searching emails:', err);
            return;
          }

          if (!results || results.length === 0) {
            return; // No new emails
          }

          console.log(`📧 Found ${results.length} new email(s)`);

          const fetch = this.imap.fetch(results, {
            bodies: '',
            markSeen: true
          });

          fetch.on('message', (msg) => {
            this.processEmail(msg);
          });

          fetch.once('error', (err) => {
            console.error('Fetch error:', err);
          });

          fetch.once('end', () => {
            console.log('✓ Finished processing emails');
          });
        });
      });
    } catch (error) {
      console.error('Error checking emails:', error);
    }
  }

  /**
   * Process individual email
   */
  async processEmail(msg) {
    let emailData = {};

    msg.on('body', (stream) => {
      simpleParser(stream, async (err, parsed) => {
        if (err) {
          console.error('Error parsing email:', err);
          return;
        }

        emailData = {
          from: parsed.from.text,
          subject: parsed.subject,
          text: parsed.text,
          attachments: parsed.attachments
        };

        console.log(`  Processing: "${parsed.subject}" from ${parsed.from.text}`);

        // Check for resume attachments
        const resumes = parsed.attachments.filter(att => {
          if (!att.filename) return false;
          const ext = path.extname(att.filename).toLowerCase();
          return ['.pdf', '.docx', '.doc', '.txt'].includes(ext);
        });

        if (resumes.length === 0) {
          console.log('  No resume attachments found');
          await this.logEmail(emailData, false, null, 'No resume attachment');
          return;
        }

        // Process each resume attachment
        for (const resume of resumes) {
          await this.processResumeAttachment(resume, emailData);
        }
      });
    });

    msg.once('end', () => {
      console.log('  Email processed');
    });
  }

  /**
   * Process resume attachment
   */
  async processResumeAttachment(attachment, emailData) {
    try {
      // Save attachment temporarily
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      const filePath = path.join(uploadsDir, attachment.filename);

      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.writeFile(filePath, attachment.content);

      console.log(`  📄 Processing resume: ${attachment.filename}`);

      // Parse resume
      const mimeType = attachment.contentType;
      const parsed = await this.resumeParser.parseResume(filePath, mimeType);

      if (!parsed.success) {
        console.error('  Failed to parse resume:', parsed.error);
        await this.logEmail(emailData, false, null, parsed.error);
        return;
      }

      // Extract sender info if not in resume
      const candidateName = parsed.name || emailData.from.split('<')[0].trim();
      const candidateEmail = parsed.email || (emailData.from.match(/<(.+)>/) || [])[1];

      // Save candidate to database
      const candidateId = await this.saveCandidate({
        name: candidateName,
        email: candidateEmail,
        phone: parsed.phone,
        resume_text: parsed.text,
        resume_filename: attachment.filename,
        source: 'email'
      });

      // Get active jobs and compare
      const jobs = await this.getActiveJobs();
      const comparisonResults = [];

      for (const job of jobs) {
        const comparison = await this.aiComparison.compareResumeToJob(parsed.text, job);

        if (comparison.success) {
          await this.saveComparison(candidateId, job.id, comparison);

          console.log(`  ✓ Match score for ${job.title}: ${comparison.match_score}%`);

          // Send notification if high match
          await this.notifier.sendCandidateNotification(
            { id: candidateId, name: candidateName, email: candidateEmail, phone: parsed.phone, source: 'email', created_at: new Date() },
            job,
            comparison
          );

          // Collect results for safety coordinator alert
          comparisonResults.push({
            job,
            comparison
          });
        }
      }

      // Send safety coordinator alert for high matches (80%+)
      const highMatches = comparisonResults
        .filter(({ comparison }) => comparison.match_score >= 80)
        .map(({ job, comparison }) => ({
          job_title: job.title,
          job,
          match_score: comparison.match_score,
          strengths: comparison.strengths,
          gaps: comparison.gaps,
          distance_info: null
        }))
        .sort((a, b) => b.match_score - a.match_score);

      if (highMatches.length > 0) {
        await this.notifier.sendSafetyCoordinatorAlert(
          {
            id: candidateId,
            name: candidateName,
            email: candidateEmail,
            phone: parsed.phone,
            source: 'email',
            created_at: new Date()
          },
          highMatches
        );
      }

      await this.logEmail(emailData, true, candidateId, null);

      // Clean up temp file
      await fs.unlink(filePath);

      console.log(`  ✅ Resume processed successfully for candidate #${candidateId}`);
    } catch (error) {
      console.error('  Error processing resume attachment:', error);
      await this.logEmail(emailData, false, null, error.message);
    }
  }

  /**
   * Save candidate to database
   */
  saveCandidate(candidate) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO candidates (name, email, phone, resume_text, resume_filename, source)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [candidate.name, candidate.email, candidate.phone, candidate.resume_text, candidate.resume_filename, candidate.source],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Save comparison to database
   */
  saveComparison(candidateId, jobId, comparison) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO comparisons (candidate_id, job_id, match_score, strengths, gaps, recommendations, detailed_analysis)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [candidateId, jobId, comparison.match_score, comparison.strengths, comparison.gaps, comparison.recommendations, comparison.detailed_analysis],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Get active jobs from database
   */
  getActiveJobs() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM jobs WHERE status = 'active'`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * Log email processing
   */
  logEmail(emailData, processed, candidateId, error) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO email_logs (email_subject, email_from, processed, candidate_id, error)
         VALUES (?, ?, ?, ?, ?)`,
        [emailData.subject, emailData.from, processed ? 1 : 0, candidateId, error],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Validate email configuration
   */
  validateConfig() {
    const required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD'];
    return required.every(key => process.env[key]);
  }

  /**
   * Stop email monitoring
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }

    this.isMonitoring = false;
    console.log('Email monitoring stopped');
  }
}

module.exports = EmailMonitor;
