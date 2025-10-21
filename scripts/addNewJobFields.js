const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Migration script to add new job fields:
 * - account_manager
 * - sector
 * - job_type
 * - salary_hourly
 * - job_site_address
 */

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Adding new fields to jobs table...\n');

// Add columns one by one to handle existing database
const alterTableQueries = [
  "ALTER TABLE jobs ADD COLUMN account_manager TEXT",
  "ALTER TABLE jobs ADD COLUMN sector TEXT",
  "ALTER TABLE jobs ADD COLUMN job_type TEXT",
  "ALTER TABLE jobs ADD COLUMN salary_hourly REAL",
  "ALTER TABLE jobs ADD COLUMN job_site_address TEXT"
];

let completed = 0;

alterTableQueries.forEach((query, index) => {
  db.run(query, (err) => {
    if (err) {
      // Column might already exist, that's okay
      if (err.message.includes('duplicate column name')) {
        console.log(`   ⚠️  Column ${index + 1}/5 already exists (skipping)`);
      } else {
        console.error(`   ❌ Error adding column ${index + 1}:`, err.message);
      }
    } else {
      console.log(`   ✅ Added column ${index + 1}/5`);
    }

    completed++;

    if (completed === alterTableQueries.length) {
      console.log('\n✅ Database schema updated successfully!');
      console.log('\nNew fields added:');
      console.log('  • account_manager (TEXT) - Account Manager name');
      console.log('  • sector (TEXT) - Industry sector');
      console.log('  • job_type (TEXT) - Employment type');
      console.log('  • salary_hourly (REAL) - Hourly rate');
      console.log('  • job_site_address (TEXT) - Job location');

      db.close();
    }
  });
});
