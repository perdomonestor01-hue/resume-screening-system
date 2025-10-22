const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Updating job locations to Texas addresses...');

// Texas job locations for testing distance calculator
const texasJobLocations = [
  {
    title: 'CNC Machine Operator',
    address: '2450 Technology Drive, Dallas, TX 75220'
  },
  {
    title: 'General Production Assembler',
    address: '5600 Denton Highway, Haltom City, TX 76117'
  },
  {
    title: 'Machine Operator - 2nd Shift',
    address: '1800 Industrial Boulevard, Grand Prairie, TX 75050'
  },
  {
    title: 'Forklift Operator',
    address: '3200 West Miller Road, Garland, TX 75041'
  },
  {
    title: 'MIG Welder',
    address: '4500 East Interstate 30, Mesquite, TX 75150'
  },
  {
    title: 'Industrial Maintenance Mechanic',
    address: '7800 North Stemmons Freeway, Dallas, TX 75247'
  }
];

db.serialize(() => {
  texasJobLocations.forEach(job => {
    db.run(`
      UPDATE jobs
      SET job_site_address = ?
      WHERE title = ?
    `, [job.address, job.title], (err) => {
      if (err) {
        console.error(`Error updating job ${job.title}:`, err);
      } else {
        console.log(`✓ Updated ${job.title} to ${job.address}`);
      }
    });
  });
});

setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\n✅ All jobs updated to Texas locations!');
      console.log(`Database location: ${dbPath}`);
      console.log('\n📍 Distance testing ready with these locations:');
      console.log('   - Dallas area jobs (6 locations)');
      console.log('   - Test resumes from: Dallas, Fort Worth, Houston, Arlington, Austin');
    }
  });
}, 2000);
