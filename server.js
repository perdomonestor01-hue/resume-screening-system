require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const session = require('express-session');

// Services
const resumeParser = require('./services/resumeParser');
const aiComparison = require('./services/aiComparison');
const notifier = require('./services/notifier');
const EmailMonitor = require('./services/emailMonitor');
const distanceCalculator = require('./services/distanceCalculator');
const auditLogger = require('./services/auditLogger');
const questionGenerator = require('./services/interviewQuestionGenerator');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Database - use persistent volume in production
const dbPath = process.env.NODE_ENV === 'production' ? '/app/data/database.db' : './database.db';

// Ensure data directory exists in production
if (process.env.NODE_ENV === 'production') {
  const dataDir = '/app/data';
  if (!require('fs').existsSync(dataDir)) {
    require('fs').mkdirSync(dataDir, { recursive: true });
  }
}

const db = new sqlite3.Database(dbPath);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'custom-workforce-solutions-2024-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Authentication required' });
  }
}

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
    // Initialize database tables
    await initializeDatabaseTables();

    // Auto-create admin accounts if none exist
    await initializeAdminAccounts();

    // Initialize email notifier
    await notifier.init();

    // Email monitoring disabled - resumes must be uploaded via web interface
    // emailMonitor = new EmailMonitor(db, resumeParser, aiComparison, notifier);
    // await emailMonitor.start();

    console.log('✅ All services initialized (email monitoring disabled)');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
}

// Initialize database tables on startup
function initializeDatabaseTables() {
  return new Promise((resolve, reject) => {
    // Create audit_logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_email TEXT,
        action_type TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id INTEGER,
        details TEXT,
        before_value TEXT,
        after_value TEXT,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) {
        console.error('Error creating audit_logs table:', err);
        reject(err);
      } else {
        console.log('✓ Database tables initialized');
        resolve();
      }
    });
  });
}

// Auto-create admin accounts if none exist
function initializeAdminAccounts() {
  return new Promise((resolve, reject) => {
    // Check if any admin accounts exist
    db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`, async (err, result) => {
      if (err) {
        console.error('Error checking admin accounts:', err);
        return resolve(); // Don't fail startup
      }

      if (result.count > 0) {
        console.log(`✓ Admin accounts exist (${result.count} found)`);
        return resolve();
      }

      // Create default admin accounts
      console.log('Creating default admin accounts...');
      const admins = [
        {
          name: 'Admin User',
          email: 'admin@customworkforcesolutionsllc.com',
          password: 'admin123'
        },
        {
          name: 'Lorie Cavil',
          email: 'lcavil@customworkforcesolutionsllc.com',
          password: 'LorieCWS2025!'
        },
        {
          name: 'A. Cavil',
          email: 'acavil@customworkforcesolutionsllc.com',
          password: 'AcavilCWS2025!'
        }
      ];

      let completed = 0;
      for (const admin of admins) {
        bcrypt.hash(admin.password, 10, (hashErr, hash) => {
          if (hashErr) {
            console.error(`Error hashing password for ${admin.name}:`, hashErr);
            completed++;
            if (completed === admins.length) resolve();
            return;
          }

          db.run(`
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, 'admin')
          `, [admin.name, admin.email, hash], (insertErr) => {
            if (insertErr) {
              console.error(`Failed to create ${admin.name}:`, insertErr);
            } else {
              console.log(`✓ Created admin: ${admin.email}`);
            }

            completed++;
            if (completed === admins.length) {
              console.log('✓ All admin accounts created');
              resolve();
            }
          });
        });
      }
    });
  });
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
 * One-time admin setup endpoint
 * Use: GET /api/setup-admins?secret=cws2025setup
 * Only works if no admin accounts exist
 */
app.get('/api/setup-admins', async (req, res) => {
  try {
    // Security: Require secret key
    if (req.query.secret !== 'cws2025setup') {
      return res.status(403).json({ error: 'Invalid setup secret' });
    }

    // Check if admin accounts already exist
    db.get(`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`, async (err, result) => {
      if (err) {
        console.error('Setup error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      if (result.count > 0) {
        return res.json({
          status: 'skipped',
          message: 'Admin accounts already exist',
          adminCount: result.count
        });
      }

      // Create the three admin accounts
      const admins = [
        {
          name: 'Admin User',
          email: 'admin@customworkforcesolutionsllc.com',
          password: 'admin123'
        },
        {
          name: 'Lorie Cavil',
          email: 'lcavil@customworkforcesolutionsllc.com',
          password: 'LorieCWS2025!'
        },
        {
          name: 'A. Cavil',
          email: 'acavil@customworkforcesolutionsllc.com',
          password: 'AcavilCWS2025!'
        }
      ];

      const created = [];
      let completed = 0;

      for (const admin of admins) {
        const hash = await bcrypt.hash(admin.password, 10);

        db.run(`
          INSERT INTO users (name, email, password_hash, role)
          VALUES (?, ?, ?, 'admin')
        `, [admin.name, admin.email, hash], function(err) {
          completed++;

          if (err) {
            console.error(`Failed to create ${admin.name}:`, err);
          } else {
            created.push({
              name: admin.name,
              email: admin.email
            });
          }

          // Send response when all are processed
          if (completed === admins.length) {
            res.json({
              status: 'success',
              message: 'Admin accounts created',
              created: created,
              loginUrl: '/login.html'
            });
          }
        });
      }
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Setup failed', details: error.message });
  }
});

/**
 * One-time job creation endpoint
 * Use: GET /api/create-jobs?secret=cws2025setup
 * Creates standard CWS job postings
 */
app.get('/api/create-jobs', async (req, res) => {
  try {
    // Security: Require secret key
    if (req.query.secret !== 'cws2025setup') {
      return res.status(403).json({ error: 'Invalid setup secret' });
    }

    const jobs = [
      {
        title: 'CNC Machine Operator',
        company: 'Custom Workforce Solutions LLC',
        location: 'Dallas-Fort Worth, TX',
        type: 'Full-time',
        description: 'Operate and maintain CNC machines to produce precision parts according to specifications.',
        requirements: JSON.stringify([
          '2+ years CNC machine operation experience',
          'Ability to read blueprints and technical drawings',
          'Knowledge of G-code programming',
          'Experience with quality control processes',
          'High school diploma or equivalent'
        ]),
        salary_range: '$18-25/hour',
        status: 'active'
      },
      {
        title: 'MIG Welder',
        company: 'Custom Workforce Solutions LLC',
        location: 'Fort Worth, TX',
        type: 'Full-time',
        description: 'Perform MIG welding on various metal components in a manufacturing environment.',
        requirements: JSON.stringify([
          '3+ years MIG welding experience',
          'AWS or equivalent welding certification',
          'Ability to read welding symbols and blueprints',
          'Experience with steel and aluminum welding',
          'Strong attention to detail and quality'
        ]),
        salary_range: '$20-28/hour',
        status: 'active'
      },
      {
        title: 'Forklift Operator',
        company: 'Custom Workforce Solutions LLC',
        location: 'Dallas, TX',
        type: 'Full-time',
        description: 'Safely operate forklifts to move, locate, and stack materials in warehouse environment.',
        requirements: JSON.stringify([
          'Valid forklift certification',
          '1+ years forklift operation experience',
          'Ability to lift up to 50 lbs',
          'Basic computer skills for inventory management',
          'Good safety record'
        ]),
        salary_range: '$16-20/hour',
        status: 'active'
      },
      {
        title: 'General Production Assembler',
        company: 'Custom Workforce Solutions LLC',
        location: 'Dallas-Fort Worth, TX',
        type: 'Full-time',
        description: 'Assemble products and components following standardized work instructions in a production environment.',
        requirements: JSON.stringify([
          '1+ years manufacturing or assembly experience',
          'Ability to use hand and power tools',
          'Attention to detail and quality',
          'Ability to stand for extended periods',
          'Team player with good communication skills'
        ]),
        salary_range: '$15-18/hour',
        status: 'active'
      },
      {
        title: 'Quality Control Inspector',
        company: 'Custom Workforce Solutions LLC',
        location: 'Dallas, TX',
        type: 'Full-time',
        description: 'Inspect finished products and components to ensure quality standards are met.',
        requirements: JSON.stringify([
          '2+ years quality control experience',
          'Knowledge of measurement tools (calipers, micrometers)',
          'Understanding of ISO quality standards',
          'Attention to detail',
          'Basic computer skills'
        ]),
        salary_range: '$17-22/hour',
        status: 'active'
      }
    ];

    const created = [];
    let completed = 0;

    for (const job of jobs) {
      db.run(`
        INSERT INTO jobs (
          title, company, location, type, description,
          requirements, salary_range, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        job.title,
        job.company,
        job.location,
        job.type,
        job.description,
        job.requirements,
        job.salary_range,
        job.status
      ], function(err) {
        completed++;

        if (err) {
          console.error(`Failed to create ${job.title}:`, err);
        } else {
          created.push({
            title: job.title,
            location: job.location,
            salary: job.salary_range
          });
        }

        // Send response when all are processed
        if (completed === jobs.length) {
          res.json({
            status: 'success',
            message: `Created ${created.length} job postings`,
            jobs: created,
            jobsUrl: '/manage-jobs.html'
          });
        }
      });
    }
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ error: 'Job creation failed', details: error.message });
  }
});

/**
 * Login route
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user from database
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!user) {
        // Log failed login attempt
        await auditLogger.logLogin(req, false, null, email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        // Log failed login attempt
        await auditLogger.logLogin(req, false, user.id, email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      // Set session
      req.session.userId = user.id;
      req.session.userEmail = user.email;
      req.session.userName = user.name;
      req.session.userRole = user.role;

      // Log successful login
      await auditLogger.logLogin(req, true, user.id, user.email);

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Logout route
 */
app.post('/api/logout', async (req, res) => {
  // Log logout before destroying session
  await auditLogger.logLogout(req);

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true });
  });
});

/**
 * Check authentication status
 */
app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({
      authenticated: true,
      user: {
        id: req.session.userId,
        email: req.session.userEmail,
        name: req.session.userName,
        role: req.session.userRole
      }
    });
  } else {
    res.json({ authenticated: false });
  }
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

    // Process all job comparisons in parallel for faster performance
    console.log(`🚀 Processing ${jobs.length} job comparisons in parallel...`);
    const startTime = Date.now();

    const comparisonResults = await Promise.all(
      jobs.map(async (job) => {
        // Run AI comparison and distance calculation in parallel
        const [comparison, distanceInfo] = await Promise.all([
          aiComparison.compareResumeToJob(parsed.text, job),
          (parsed.address && job.job_site_address)
            ? distanceCalculator.calculateDistance(parsed.address, job.job_site_address)
            : Promise.resolve(null)
        ]);

        if (distanceInfo) {
          if (distanceInfo.success) {
            console.log(`✅ Distance calculated for ${job.title}: ${distanceInfo.distance_miles} miles (${distanceInfo.commute_description})`);
          } else {
            console.log(`⚠️  Distance calculation failed for ${job.title}: ${distanceInfo.error}`);
          }
        }

        return { job, comparison, distanceInfo };
      })
    );

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⚡ Completed ${jobs.length} job comparisons in ${processingTime} seconds`);

    // Save results to database and prepare response
    const comparisons = [];

    for (const { job, comparison, distanceInfo } of comparisonResults) {
      if (comparison.success) {
        // Debug log to track distance values per job
        console.log(`💾 Saving comparison for "${job.title}" (ID: ${job.id}): distance_miles=${distanceInfo?.distance_miles}, job_address="${job.job_site_address}"`);

        // Save to database
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
              (distanceInfo && distanceInfo.commute_reasonable !== null && distanceInfo.commute_reasonable !== undefined) ? (distanceInfo.commute_reasonable ? 1 : 0) : null,
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

        // Individual per-job notifications disabled - consolidated alert sent below
        // await notifier.sendCandidateNotification(
        //   { id: candidateId, name: parsed.name, email: parsed.email, phone: parsed.phone, address: parsed.address, source: 'web_upload', created_at: new Date() },
        //   job,
        //   comparison,
        //   distanceInfo
        // );
      }
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    console.log(`✅ Resume processed successfully for candidate #${candidateId}`);

    // Log resume upload
    await auditLogger.logResumeUpload(req, candidateId, parsed.name, 'web_upload');

    // Sort comparisons by match score (highest to lowest)
    comparisons.sort((a, b) => b.match_score - a.match_score);

    // Send consolidated alert for all matches meeting threshold
    const threshold = parseInt(process.env.NOTIFICATION_THRESHOLD) || 75;
    const highMatches = comparisonResults
      .filter(({ comparison }) => comparison.success && comparison.match_score >= threshold)
      .map(({ job, comparison, distanceInfo }) => ({
        job_title: job.title,
        job,
        match_score: comparison.match_score,
        strengths: comparison.strengths,
        gaps: comparison.gaps,
        recommendations: comparison.recommendations,
        distance_info: distanceInfo
      }))
      .sort((a, b) => b.match_score - a.match_score);

    if (highMatches.length > 0) {
      await notifier.sendSafetyCoordinatorAlert(
        {
          id: candidateId,
          name: parsed.name,
          email: parsed.email,
          phone: parsed.phone,
          address: parsed.address,
          source: 'web_upload',
          created_at: new Date()
        },
        highMatches
      );
    }

    // Send confirmation email to candidate
    await notifier.sendCandidateConfirmationEmail(
      {
        id: candidateId,
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        address: parsed.address,
        source: 'web_upload',
        created_at: new Date()
      },
      comparisonResults
    );

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
    ORDER BY c.created_at DESC
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
app.get('/api/candidates/:id', async (req, res) => {
  const candidateQuery = 'SELECT * FROM candidates WHERE id = ?';
  const comparisonsQuery = `
    SELECT co.*, j.title as job_title, j.description as job_description, j.job_site_address
    FROM comparisons co
    JOIN jobs j ON co.job_id = j.id
    WHERE co.candidate_id = ?
    ORDER BY co.match_score DESC
  `;

  db.get(candidateQuery, [req.params.id], async (err, candidate) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.all(comparisonsQuery, [req.params.id], async (err, comparisons) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Skip distance calculation to avoid rate limiting issues
      // Just return job comparisons without distance data
      const comparisonsWithDistance = comparisons.map((comp) => {
        // Remove job site address from response (privacy)
        const { job_site_address, ...compWithoutAddress } = comp;
        return compWithoutAddress;
      });

      // Remove candidate address from response (privacy)
      const { address, ...candidateWithoutAddress } = candidate;

      // Log candidate access
      await auditLogger.logCandidateView(req, parseInt(req.params.id), candidate.name);

      res.json({
        ...candidateWithoutAddress,
        comparisons: comparisonsWithDistance
      });
    });
  });
});

/**
 * Generate interview questions for a candidate
 */
app.post('/api/candidates/:id/generate-questions', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.id);
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    // Get candidate data
    const candidate = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM candidates WHERE id = ?', [candidateId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Get job data
    const job = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM jobs WHERE id = ?', [job_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Get comparison data for context
    const comparison = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM comparisons WHERE candidate_id = ? AND job_id = ?',
        [candidateId, job_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!comparison) {
      return res.status(404).json({
        error: 'No comparison found. Please ensure candidate has been matched against this job first.'
      });
    }

    // Check if questions already generated for this candidate+job combination
    const existing = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM interview_questions WHERE candidate_id = ? AND job_id = ? ORDER BY generated_at DESC LIMIT 1',
        [candidateId, job_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // If questions exist and were generated in last 24 hours, return cached version
    if (existing) {
      const generatedDate = new Date(existing.generated_at);
      const hoursSinceGeneration = (Date.now() - generatedDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceGeneration < 24) {
        console.log(`Returning cached questions for candidate ${candidateId}, job ${job_id}`);
        return res.json({
          questions: JSON.parse(existing.questions),
          cached: true,
          generated_at: existing.generated_at
        });
      }
    }

    console.log(`🤖 Generating interview questions for ${candidate.name} - ${job.title}...`);

    // Generate new questions
    const result = await questionGenerator.generateQuestions(
      candidate.resume_text,
      job,
      comparison,
      candidate.name
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to generate questions',
        details: result.error
      });
    }

    // Save questions to database
    const userId = req.session?.userId || null;
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO interview_questions (candidate_id, job_id, questions, generated_by)
         VALUES (?, ?, ?, ?)`,
        [candidateId, job_id, JSON.stringify(result.questions), userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    console.log(`✅ Interview questions generated and saved for candidate ${candidateId}`);

    res.json({
      questions: result.questions,
      cached: false,
      generated_at: new Date().toISOString(),
      total_count: result.total_count
    });

  } catch (error) {
    console.error('Error generating interview questions:', error);
    res.status(500).json({
      error: 'Failed to generate interview questions',
      message: error.message
    });
  }
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
 * Create new job (requires authentication)
 */
app.post('/api/jobs', requireAdmin, async (req, res) => {
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

  const userId = req.session.userId;

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
      job_site_address,
      created_by,
      updated_by
    )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      userId,
      userId
    ],
    async function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const jobId = this.lastID;

      // Log job creation
      await auditLogger.logJobCreate(req, jobId, {
        id: jobId,
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
      });

      res.json({ id: jobId, message: 'Job created successfully' });
    }
  );
});

/**
 * Update job (requires authentication)
 */
app.put('/api/jobs/:id', requireAdmin, async (req, res) => {
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

  const userId = req.session.userId;
  const jobId = req.params.id;

  // Get current job data before update
  db.get('SELECT * FROM jobs WHERE id = ?', [jobId], async (err, beforeData) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!beforeData) {
      return res.status(404).json({ error: 'Job not found' });
    }

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
        version = version + 1,
        updated_by = ?,
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
        userId,
        jobId
      ],
      async function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Job not found' });
        }

        // Get updated job data
        db.get('SELECT * FROM jobs WHERE id = ?', [jobId], async (err, afterData) => {
          if (!err && afterData) {
            // Log job update with before/after values
            await auditLogger.logJobUpdate(req, parseInt(jobId), beforeData, afterData);
          }
          res.json({ message: 'Job updated successfully' });
        });
      }
    );
  });
});

/**
 * Delete job (requires authentication)
 */
app.delete('/api/jobs/:id', requireAdmin, async (req, res) => {
  const jobId = req.params.id;

  // Get job data before deletion (for audit trail)
  db.get('SELECT * FROM jobs WHERE id = ?', [jobId], async (err, jobData) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!jobData) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Delete the job
    db.run('DELETE FROM jobs WHERE id = ?', [jobId], async function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Log deletion with full job data snapshot
      await auditLogger.logJobDelete(req, parseInt(jobId), jobData);

      res.json({ message: 'Job deleted successfully' });
    });
  });
});

/**
 * Admin middleware - require admin role
 */
function requireAdmin(req, res, next) {
  if (req.session && req.session.userId && req.session.userRole === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access required' });
  }
}

// ========== AUDIT LOG ENDPOINTS ==========

/**
 * Get audit logs with optional filters (admin only)
 */
app.get('/api/audit-logs', requireAdmin, async (req, res) => {
  try {
    const { user_id, action_type, resource_type, resource_id, limit, offset } = req.query;

    const logs = await auditLogger.getAuditLogs({
      userId: user_id ? parseInt(user_id) : null,
      actionType: action_type,
      resourceType: resource_type,
      resourceId: resource_id ? parseInt(resource_id) : null,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get audit log statistics (admin only)
 */
app.get('/api/audit-logs/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await auditLogger.getAuditStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get audit logs for a specific user (admin only)
 */
app.get('/api/audit-logs/user/:userId', requireAdmin, async (req, res) => {
  try {
    const logs = await auditLogger.getAuditLogs({
      userId: parseInt(req.params.userId),
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get audit logs for a specific resource (admin only)
 */
app.get('/api/audit-logs/resource/:type/:id', requireAdmin, async (req, res) => {
  try {
    const logs = await auditLogger.getAuditLogs({
      resourceType: req.params.type,
      resourceId: parseInt(req.params.id),
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching resource audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== STATISTICS ==========

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
