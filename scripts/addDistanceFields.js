const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding distance-related fields to database...');

db.serialize(() => {
  // Add address column to candidates table
  db.run(`
    ALTER TABLE candidates
    ADD COLUMN address TEXT
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ Address column already exists in candidates table');
      } else {
        console.error('Error adding address column:', err.message);
      }
    } else {
      console.log('✓ Added address column to candidates table');
    }
  });

  // Add distance-related columns to comparisons table
  const distanceColumns = [
    'distance_km REAL',
    'distance_miles REAL',
    'commute_reasonable INTEGER',
    'commute_description TEXT',
    'distance_calculated INTEGER DEFAULT 0'
  ];

  distanceColumns.forEach((column) => {
    const columnName = column.split(' ')[0];
    db.run(`
      ALTER TABLE comparisons
      ADD COLUMN ${column}
    `, (err) => {
      if (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`✓ ${columnName} column already exists in comparisons table`);
        } else {
          console.error(`Error adding ${columnName} column:`, err.message);
        }
      } else {
        console.log(`✓ Added ${columnName} column to comparisons table`);
      }
    });
  });

  // Add employment_gap_detected and employment_gap_details if they don't exist
  db.run(`
    ALTER TABLE comparisons
    ADD COLUMN employment_gap_detected INTEGER DEFAULT 0
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ employment_gap_detected column already exists');
      } else {
        console.error('Error adding employment_gap_detected column:', err.message);
      }
    } else {
      console.log('✓ Added employment_gap_detected column to comparisons table');
    }
  });

  db.run(`
    ALTER TABLE comparisons
    ADD COLUMN employment_gap_details TEXT
  `, (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✓ employment_gap_details column already exists');
      } else {
        console.error('Error adding employment_gap_details column:', err.message);
      }
    } else {
      console.log('✓ Added employment_gap_details column to comparisons table');
    }
  });

  // Update sample jobs with addresses
  const sampleJobAddresses = [
    { title: 'CNC Machine Operator', address: '1500 Industrial Parkway, Madison, WI 53713' },
    { title: 'General Production Assembler', address: '2200 Manufacturing Drive, Milwaukee, WI 53202' },
    { title: 'Machine Operator - 2nd Shift', address: '850 Factory Road, Green Bay, WI 54304' },
    { title: 'Forklift Operator', address: '3400 Warehouse Avenue, Kenosha, WI 53140' },
    { title: 'MIG Welder', address: '1800 Fabrication Street, Racine, WI 53403' },
    { title: 'Industrial Maintenance Mechanic', address: '950 Plant Circle, Appleton, WI 54911' }
  ];

  sampleJobAddresses.forEach(job => {
    db.run(`
      UPDATE jobs
      SET job_site_address = ?
      WHERE title = ? AND (job_site_address IS NULL OR job_site_address = '')
    `, [job.address, job.title], (err) => {
      if (err) {
        console.error(`Error updating job ${job.title}:`, err);
      } else {
        console.log(`✓ Updated address for: ${job.title}`);
      }
    });
  });
});

setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\n✅ Database migration completed successfully!');
      console.log(`Database location: ${dbPath}`);
    }
  });
}, 2000);
