const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🏭 Creating Custom Workforce Solutions job postings...\n');

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

let completed = 0;
const created = [];

jobs.forEach((job, index) => {
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
      console.error(`❌ Failed to create ${job.title}:`, err);
    } else {
      created.push(job.title);
      console.log(`✅ Created: ${job.title}`);
      console.log(`   Location: ${job.location}`);
      console.log(`   Salary: ${job.salary_range}\n`);
    }

    if (completed === jobs.length) {
      console.log(`\n🎉 Successfully created ${created.length} job postings!\n`);
      console.log('Jobs available:');
      created.forEach((title, i) => console.log(`${i + 1}. ${title}`));
      console.log('\nResumes can now be matched against these positions.');
      db.close();
    }
  });
});
