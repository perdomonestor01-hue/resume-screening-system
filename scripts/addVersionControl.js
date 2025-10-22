const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding version control to jobs table...');

db.serialize(() => {
  // Add version column to jobs table
  db.run(`
    ALTER TABLE jobs
    ADD COLUMN version INTEGER DEFAULT 0
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ Version column already exists in jobs table');
      } else {
        console.error('Error adding version column:', err.message);
      }
    } else {
      console.log('✓ Added version column to jobs table');
    }
  });

  // Update existing jobs to have version 0
  db.run(`
    UPDATE jobs
    SET version = 0
    WHERE version IS NULL
  `, (err) => {
    if (err) {
      console.error('Error setting default versions:', err);
    } else {
      console.log('✓ Set all existing jobs to version 0');
    }
  });
});

setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\n✅ Version control migration completed successfully!');
      console.log(`Database location: ${dbPath}`);
    }
  });
}, 2000);
