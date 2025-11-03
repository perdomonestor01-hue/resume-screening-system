const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Adding Cavil admin accounts...\n');

db.serialize(async () => {
  // Create Lorie Cavil admin account
  const loriePassword = 'LorieCWS2025!';
  bcrypt.hash(loriePassword, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing Lorie password:', err);
      return;
    }

    db.run(`
      INSERT INTO users (name, email, password_hash, role)
      SELECT 'Lorie Cavil', 'lcavil@customworkforcesolutionsllc.com', ?, 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'lcavil@customworkforcesolutionsllc.com')
    `, [hash], (err) => {
      if (err) {
        console.error('Error creating Lorie Cavil admin:', err);
      } else {
        console.log('✓ Lorie Cavil admin account created');
        console.log('  Email: lcavil@customworkforcesolutionsllc.com');
        console.log('  Password: LorieCWS2025!');
        console.log('  Role: admin (full access including audit trail)');
      }
    });
  });

  // Create A. Cavil admin account
  const acavilPassword = 'AcavilCWS2025!';
  bcrypt.hash(acavilPassword, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing A. Cavil password:', err);
      return;
    }

    db.run(`
      INSERT INTO users (name, email, password_hash, role)
      SELECT 'A. Cavil', 'acavil@customworkforcesolutionsllc.com', ?, 'admin'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'acavil@customworkforcesolutionsllc.com')
    `, [hash], (err) => {
      if (err) {
        console.error('Error creating A. Cavil admin:', err);
      } else {
        console.log('\n✓ A. Cavil admin account created');
        console.log('  Email: acavil@customworkforcesolutionsllc.com');
        console.log('  Password: AcavilCWS2025!');
        console.log('  Role: admin (full access including audit trail)');
      }
    });
  });

  // Display all admin users after updates
  setTimeout(() => {
    console.log('\n📋 Current Admin Users in System:\n');
    db.all(`SELECT id, name, email, role, created_at FROM users WHERE role = 'admin' ORDER BY email`, (err, users) => {
      if (err) {
        console.error('Error fetching admin users:', err);
      } else {
        users.forEach(user => {
          console.log(`👑 ${user.name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   Created: ${user.created_at}`);
          console.log('');
        });
      }

      console.log('✅ Admin accounts setup complete!\n');
      console.log('All three accounts now have full admin access:');
      console.log('- admin@customworkforcesolutionsllc.com');
      console.log('- acavil@customworkforcesolutionsllc.com');
      console.log('- lcavil@customworkforcesolutionsllc.com');

      db.close();
    });
  }, 1000);
});
