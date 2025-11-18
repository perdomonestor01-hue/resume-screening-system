const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Initializing database...');

db.serialize(() => {
  // Users Table (for authentication)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'recruiter',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `, (err) => {
    if (err) console.error('Error creating users table:', err);
    else {
      console.log('✓ Users table created');

      // Create default admin user (admin@customworkforcesolutions.com / admin123)
      const defaultPassword = 'admin123';
      bcrypt.hash(defaultPassword, 10, (err, hash) => {
        if (err) {
          console.error('Error hashing password:', err);
          return;
        }

        db.run(`
          INSERT INTO users (name, email, password_hash, role)
          SELECT 'Admin User', 'admin@customworkforcesolutions.com', ?, 'admin'
          WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@customworkforcesolutions.com')
        `, [hash], (err) => {
          if (err) console.error('Error creating default user:', err);
          else console.log('✓ Default admin user created (admin@customworkforcesolutions.com / admin123)');
        });
      });
    }
  });

  // Job Descriptions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      required_skills TEXT,
      preferred_skills TEXT,
      experience_level TEXT,
      education_requirements TEXT,
      account_manager TEXT,
      sector TEXT,
      job_type TEXT,
      salary_hourly REAL,
      job_site_address TEXT,
      status TEXT DEFAULT 'active',
      version INTEGER DEFAULT 1,
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating jobs table:', err);
    else console.log('✓ Jobs table created');
  });

  // Candidates/Resumes Table
  db.run(`
    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      resume_text TEXT NOT NULL,
      resume_filename TEXT,
      source TEXT DEFAULT 'web_upload',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating candidates table:', err);
    else console.log('✓ Candidates table created');
  });

  // Comparison Results Table
  db.run(`
    CREATE TABLE IF NOT EXISTS comparisons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      match_score INTEGER NOT NULL,
      strengths TEXT,
      gaps TEXT,
      recommendations TEXT,
      detailed_analysis TEXT,
      employment_gap_detected INTEGER DEFAULT 0,
      employment_gap_details TEXT,
      distance_km REAL,
      distance_miles REAL,
      commute_reasonable INTEGER,
      commute_description TEXT,
      distance_calculated INTEGER DEFAULT 0,
      notified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    )
  `, (err) => {
    if (err) console.error('Error creating comparisons table:', err);
    else console.log('✓ Comparisons table created');
  });

  // Email Processing Logs
  db.run(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_subject TEXT,
      email_from TEXT,
      processed INTEGER DEFAULT 0,
      candidate_id INTEGER,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id)
    )
  `, (err) => {
    if (err) console.error('Error creating email_logs table:', err);
    else console.log('✓ Email logs table created');
  });

  // Audit Logs - Track all user actions for accountability
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
    if (err) console.error('Error creating audit_logs table:', err);
    else console.log('✓ Audit logs table created');
  });

  // Interview Questions - AI-generated interview questions for candidates
  db.run(`
    CREATE TABLE IF NOT EXISTS interview_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      candidate_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      questions TEXT NOT NULL,
      generated_by INTEGER,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidates(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id),
      FOREIGN KEY (generated_by) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error('Error creating interview_questions table:', err);
    else console.log('✓ Interview questions table created');
  });

  // Insert sample manufacturing job descriptions with Texas addresses
  const sampleJobs = [
    {
      title: 'CNC Machine Operator',
      description: 'We are seeking a reliable CNC Machine Operator to set up, operate, and maintain CNC machines to produce precision parts. The ideal candidate will have experience reading blueprints, performing quality checks, and maintaining a safe work environment. This is a 1st shift position in a climate-controlled facility.',
      required_skills: 'CNC machine operation, blueprint reading, basic math, measuring tools (calipers, micrometers), safety procedures, 1+ years experience',
      preferred_skills: 'Fanuc or Haas controller experience, G-code programming, forklift certification, preventive maintenance',
      experience_level: '1-3 years',
      education_requirements: 'High school diploma or GED',
      job_site_address: '2450 W Loop 820 N, Fort Worth, TX 76106'
    },
    {
      title: 'General Production Assembler',
      description: 'Looking for detail-oriented General Assemblers to join our production team. You will assemble products according to specifications, perform quality inspections, and maintain a clean workspace. No prior experience required - we provide on-the-job training. Multiple shifts available.',
      required_skills: 'Ability to follow instructions, hand-eye coordination, able to stand for 8-10 hours, lift up to 35 lbs, pass background check',
      preferred_skills: 'Previous assembly or manufacturing experience, ability to use hand and power tools, quality control experience',
      experience_level: 'Entry level to 2 years',
      education_requirements: 'High school diploma or GED preferred',
      job_site_address: '8500 N Stemmons Fwy, Dallas, TX 75247'
    },
    {
      title: 'Machine Operator - 2nd Shift',
      description: 'We need experienced Machine Operators for our 2nd shift production line. Responsibilities include operating manufacturing equipment, monitoring product quality, performing basic maintenance, and documenting production data. Shift differential pay offered.',
      required_skills: 'Machine operation experience, attention to detail, basic computer skills for data entry, reliable attendance, 6+ months manufacturing experience',
      preferred_skills: 'Injection molding or stamping experience, Six Sigma or Lean Manufacturing knowledge, forklift license',
      experience_level: '6 months - 2 years',
      education_requirements: 'High school diploma or GED',
      job_site_address: '1350 Airport Fwy, Irving, TX 75062'
    },
    {
      title: 'Forklift Operator',
      description: 'Hiring experienced Forklift Operators for warehouse and production floor material handling. Must be able to safely operate sit-down and stand-up forklifts, load/unload trucks, and maintain accurate inventory. Excellent attendance required. Day and evening shifts available.',
      required_skills: 'Valid forklift certification, 2+ years forklift operation, able to lift 50+ lbs, good attendance record, basic computer/RF scanner skills',
      preferred_skills: 'Reach truck or order picker experience, WMS system knowledge, shipping/receiving background, bilingual English/Spanish',
      experience_level: '2+ years',
      education_requirements: 'High school diploma or GED',
      job_site_address: '3200 Story Rd W, Irving, TX 75038'
    },
    {
      title: 'MIG Welder',
      description: 'Seeking skilled MIG Welders to join our fabrication team. You will weld structural steel components, read blueprints, and ensure all welds meet quality and safety standards. AWS certification preferred. Must pass weld test. Competitive pay based on experience.',
      required_skills: 'MIG welding experience, blueprint reading, welding symbols knowledge, able to pass weld test, OSHA safety awareness, 2+ years welding',
      preferred_skills: 'AWS certified welder, TIG or Stick welding, metal fabrication experience, overhead crane operation, D1.1 structural code knowledge',
      experience_level: '2-5 years',
      education_requirements: 'High school diploma or GED, welding certificate/training preferred',
      job_site_address: '1500 W Pioneer Pkwy, Grand Prairie, TX 75051'
    },
    {
      title: 'Industrial Maintenance Mechanic',
      description: 'Looking for a skilled Industrial Maintenance Mechanic to maintain and repair production equipment. You will troubleshoot mechanical, electrical, hydraulic, and pneumatic systems to minimize downtime. Must be available for rotating shifts including weekends and on-call emergency repairs.',
      required_skills: 'Industrial maintenance experience, mechanical troubleshooting, basic electrical skills, PM program knowledge, hand/power tools, 3+ years experience',
      preferred_skills: 'PLC troubleshooting, welding skills, hydraulics/pneumatics certification, journeyman mechanic license, CMMS experience, 480V electrical',
      experience_level: '3-7 years',
      education_requirements: 'High school diploma or GED, technical certificate or associate degree preferred',
      job_site_address: '4600 W Walnut St, Garland, TX 75042'
    }
  ];

  sampleJobs.forEach(job => {
    db.run(`
      INSERT INTO jobs (title, description, required_skills, preferred_skills, experience_level, education_requirements, job_site_address)
      SELECT ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM jobs WHERE title = ?)
    `, [job.title, job.description, job.required_skills, job.preferred_skills, job.experience_level, job.education_requirements, job.job_site_address, job.title],
    (err) => {
      if (err) console.error(`Error inserting job ${job.title}:`, err);
      else console.log(`✓ Sample job added: ${job.title} at ${job.job_site_address}`);
    });
  });

  // Wait for async operations (bcrypt hash) before closing
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('\n✅ Database initialized successfully!');
        console.log(`Database location: ${dbPath}`);
      }
    });
  }, 2000);
});
