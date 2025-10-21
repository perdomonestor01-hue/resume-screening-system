require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;

// Services
const resumeParser = require('./services/resumeParser');
const aiComparison = require('./services/aiComparison');
const notifier = require('./services/notifier');
const EmailMonitor = require('./services/emailMonitor');
const distanceCalculator = require('./services/distanceCalculator');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Database
const db = new sqlite3.Database('./database.db');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Initialize services
let emailMonitor;

async function initializeServices() {
  try {
    // Initialize email notifier
    await notifier.init();

    // Initialize email monitor
    emailMonitor = new EmailMonitor(db, resumeParser, aiComparison, notifier);
    await emailMonitor.start();

    console.log('✅ All services initialized');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
}

// ========== API ROUTES ==========

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    emailMonitoring: emailMonitor?.isMonitoring || false,
    timestamp: new Date().toISOString()
  });
});

/**
 * Upload resume via web interface
 */
app.post('/api/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`📤 Processing uploaded resume: ${req.file.originalname}`);

    // Validate file
    const validation = resumeParser.validateFile(req.file);
    if (!validation.valid) {
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: validation.error });
    }

    // Parse resume
    const parsed = await resumeParser.parseResume(req.file.path, req.file.mimetype);

    if (!parsed.success) {
      await fs.unlink(req.file.path);
      return res.status(500).json({ error: 'Failed to parse resume: ' + parsed.error });
    }

    // Log extracted address
    if (parsed.address) {
      console.log(`📍 Extracted address: ${parsed.address}`);
    } else {
      console.log('⚠️  No address found in resume');
    }

    // Save candidate
    const candidateId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO candidates (name, email, phone, address, resume_text, resume_filename, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [parsed.name, parsed.email, parsed.phone, parsed.address, parsed.text, req.file.originalname, 'web_upload'],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Get active jobs and compare
    const jobs = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM jobs WHERE status = 'active'`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const comparisons = [];

    for (const job of jobs) {
      const comparison = await aiComparison.compareResumeToJob(parsed.text, job);

      // Calculate distance if both addresses are available
      let distanceInfo = null;
      if (parsed.address && job.job_site_address) {
        console.log(`📏 Calculating distance from ${parsed.address} to ${job.job_site_address}`);
        distanceInfo = await distanceCalculator.calculateDistance(parsed.address, job.job_site_address);

        if (distanceInfo.success) {
          console.log(`✅ Distance calculated: ${distanceInfo.distance_miles} miles (${distanceInfo.commute_description})`);
        } else {
          console.log(`⚠️  Distance calculation failed: ${distanceInfo.error}`);
        }
      }

      if (comparison.success) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO comparisons (
              candidate_id, job_id, match_score, strengths, gaps, recommendations, detailed_analysis,
              employment_gap_detected, employment_gap_details,
              distance_km, distance_miles, commute_reasonable, commute_description, distance_calculated
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              candidateId,
              job.id,
              comparison.match_score,
              comparison.strengths,
              comparison.gaps,
              comparison.recommendations,
              comparison.detailed_analysis,
              comparison.employment_gap_detected ? 1 : 0,
              comparison.employment_gap_details || null,
              distanceInfo?.distance_km || null,
              distanceInfo?.distance_miles || null,
              distanceInfo?.commute_reasonable !== null ? (distanceInfo.commute_reasonable ? 1 : 0) : null,
              distanceInfo?.commute_description || null,
              distanceInfo?.success ? 1 : 0
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        comparisons.push({
          job_id: job.id,
          job_title: job.title,
          ...comparison,
          distance_info: distanceInfo
        });

        // Send notification if high match
        await notifier.sendCandidateNotification(
          { id: candidateId, name: parsed.name, email: parsed.email, phone: parsed.phone, address: parsed.address, source: 'web_upload', created_at: new Date() },
          job,
          { ...comparison, distance_info: distanceInfo }
        );
      }
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    console.log(`✅ Resume processed successfully for candidate #${candidateId}`);

    // Sort comparisons by match score (highest to lowest)
    comparisons.sort((a, b) => b.match_score - a.match_score);

    res.json({
      success: true,
      candidate_id: candidateId,
      candidate: {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone
      },
      comparisons
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all candidates with their best match scores
 */
app.get('/api/candidates', (req, res) => {
  const query = `
    SELECT
      c.*,
      MAX(co.match_score) as best_match_score,
      j.title as best_match_job
    FROM candidates c
    LEFT JOIN comparisons co ON c.id = co.candidate_id
    LEFT JOIN jobs j ON co.job_id = j.id
    GROUP BY c.id
    ORDER BY best_match_score DESC, c.created_at DESC
  `;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * Get candidate details with all comparisons
 */
app.get('/api/candidates/:id', (req, res) => {
  const candidateQuery = 'SELECT * FROM candidates WHERE id = ?';
  const comparisonsQuery = `
    SELECT co.*, j.title as job_title, j.description as job_description
    FROM comparisons co
    JOIN jobs j ON co.job_id = j.id
    WHERE co.candidate_id = ?
    ORDER BY co.match_score DESC
  `;

  db.get(candidateQuery, [req.params.id], (err, candidate) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.all(comparisonsQuery, [req.params.id], (err, comparisons) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        ...candidate,
        comparisons
      });
    });
  });
});

/**
 * Get all jobs
 */
app.get('/api/jobs', (req, res) => {
  db.all('SELECT * FROM jobs ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/**
 * Get job by ID
 */
app.get('/api/jobs/:id', (req, res) => {
  db.get('SELECT * FROM jobs WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(row);
  });
});

/**
 * Create new job
 */
app.post('/api/jobs', (req, res) => {
  const {
    title,
    description,
    required_skills,
    preferred_skills,
    experience_level,
    education_requirements,
    account_manager,
    sector,
    job_type,
    salary_hourly,
    job_site_address
  } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  db.run(
    `INSERT INTO jobs (
      title,
      description,
      required_skills,
      preferred_skills,
      experience_level,
      education_requirements,
      account_manager,
      sector,
      job_type,
      salary_hourly,
      job_site_address
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description,
      required_skills,
      preferred_skills,
      experience_level,
      education_requirements,
      account_manager,
      sector,
      job_type,
      salary_hourly,
      job_site_address
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, message: 'Job created successfully' });
    }
  );
});

/**
 * Update job
 */
app.put('/api/jobs/:id', (req, res) => {
  const {
    title,
    description,
    required_skills,
    preferred_skills,
    experience_level,
    education_requirements,
    account_manager,
    sector,
    job_type,
    salary_hourly,
    job_site_address,
    status
  } = req.body;

  db.run(
    `UPDATE jobs SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      required_skills = COALESCE(?, required_skills),
      preferred_skills = COALESCE(?, preferred_skills),
      experience_level = COALESCE(?, experience_level),
      education_requirements = COALESCE(?, education_requirements),
      account_manager = COALESCE(?, account_manager),
      sector = COALESCE(?, sector),
      job_type = COALESCE(?, job_type),
      salary_hourly = COALESCE(?, salary_hourly),
      job_site_address = COALESCE(?, job_site_address),
      status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      title,
      description,
      required_skills,
      preferred_skills,
      experience_level,
      education_requirements,
      account_manager,
      sector,
      job_type,
      salary_hourly,
      job_site_address,
      status,
      req.params.id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json({ message: 'Job updated successfully' });
    }
  );
});

/**
 * Delete job
 */
app.delete('/api/jobs/:id', (req, res) => {
  db.run('DELETE FROM jobs WHERE id = ?', [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  });
});

/**
 * Get statistics
 */
app.get('/api/stats', (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as total FROM candidates', (err, row) => {
    stats.total_candidates = row.total;

    db.get('SELECT COUNT(*) as total FROM jobs WHERE status = "active"', (err, row) => {
      stats.active_jobs = row.total;

      db.get('SELECT COUNT(*) as total FROM comparisons WHERE match_score >= 70', (err, row) => {
        stats.high_matches = row.total;

        db.get('SELECT AVG(match_score) as avg FROM comparisons', (err, row) => {
          stats.average_score = Math.round(row.avg || 0);

          res.json(stats);
        });
      });
    });
  });
});

// ========== START SERVER ==========

app.listen(PORT, async () => {
  console.log('');
  console.log('╔════════════════════════════════════════════╗');
  console.log('║  Resume Screening System                  ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('📱 Available pages:');
  console.log(`   - Upload: http://localhost:${PORT}`);
  console.log(`   - Dashboard: http://localhost:${PORT}/dashboard.html`);
  console.log(`   - Jobs: http://localhost:${PORT}/jobs.html`);
  console.log('');

  await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  if (emailMonitor) {
    emailMonitor.stop();
  }
  db.close();
  process.exit(0);
});
