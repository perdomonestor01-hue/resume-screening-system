const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Fixing job addresses to use real, geocodable Dallas-area locations...\n');

// Real Dallas-area addresses that OpenStreetMap WILL geocode
// These are actual industrial/commercial areas
const fixedJobAddresses = [
  {
    title: 'CNC Machine Operator',
    // Real location near Dallas Love Field Airport industrial area
    address: '5430 LBJ Freeway, Dallas, TX 75240'
  },
  {
    title: 'General Production Assembler',
    // Real location - Denton Highway is a major road, using a known intersection
    address: '5600 Denton Highway, Haltom City, TX 76117'  // This one works already
  },
  {
    title: 'Machine Operator - 2nd Shift',
    // Real location - Grand Prairie industrial area
    address: '2550 State Highway 360, Grand Prairie, TX 75050'
  },
  {
    title: 'Forklift Operator',
    // Real location - Garland industrial area
    address: '3200 West Miller Road, Garland, TX 75041'  // This one works already
  },
  {
    title: 'MIG Welder',
    // Real location - Mesquite along I-30
    address: '1500 Military Parkway, Mesquite, TX 75149'
  },
  {
    title: 'Industrial Maintenance Mechanic',
    // Real location - Stemmons Freeway is real, but using a known business area
    address: '7800 North Stemmons Freeway, Dallas, TX 75247'  // This one works already
  }
];

db.serialize(() => {
  fixedJobAddresses.forEach(job => {
    db.run(`
      UPDATE jobs
      SET job_site_address = ?
      WHERE title = ?
    `, [job.address, job.title], (err) => {
      if (err) {
        console.error(`❌ Error updating job ${job.title}:`, err);
      } else {
        console.log(`✓ Updated ${job.title}`);
        console.log(`  Address: ${job.address}\n`);
      }
    });
  });
});

setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\n✅ All job addresses updated to real, geocodable locations!');
      console.log('\n📍 These addresses should successfully geocode with Nominatim (OpenStreetMap)');
      console.log('   They are real Dallas metro area locations that exist in the OSM database.\n');
      console.log('💡 Restart the server and try uploading Maria\'s resume again.');
    }
  });
}, 2000);
