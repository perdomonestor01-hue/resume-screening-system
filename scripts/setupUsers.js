const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('Setting up users for Custom Workforce Solutions LLC...\n');

db.serialize(async () => {
  // 1. Update existing admin email to correct domain
  db.run(`
    UPDATE users
    SET email = 'admin@customworkforcesolutionsllc.com',
        name = 'Admin User'
    WHERE email = 'admin@customworkforcesolutions.com'
  `, (err) => {
    if (err) {
      console.error('Error updating admin email:', err);
    } else {
      console.log('✓ Admin email updated to: admin@customworkforcesolutionsllc.com');
      console.log('  Password: admin123');
      console.log('  Role: admin (full access including audit trail)');
    }
  });

  // 2. Create safety coordinator user
  const safetyPassword = 'Safety2025!';
  bcrypt.hash(safetyPassword, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing safety password:', err);
      return;
    }

    db.run(`
      INSERT INTO users (name, email, password_hash, role)
      SELECT 'Safety Coordinator', 'safety@customworkforcesolutionsllc.com', ?, 'recruiter'
      WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'safety@customworkforcesolutionsllc.com')
    `, [hash], (err) => {
      if (err) {
        console.error('Error creating safety coordinator user:', err);
      } else {
        console.log('\n✓ Safety Coordinator user created: safety@customworkforcesolutionsllc.com');
        console.log('  Password: Safety2025!');
        console.log('  Role: recruiter (standard access, no audit trail)');
      }
    });
  });

  // 3. Display all users after updates
  setTimeout(() => {
    console.log('\n📋 Current Users in System:\n');
    db.all(`SELECT id, name, email, role, created_at FROM users ORDER BY role DESC, email`, (err, users) => {
      if (err) {
        console.error('Error fetching users:', err);
      } else {
        users.forEach(user => {
          const roleEmoji = user.role === 'admin' ? '👑' : '👤';
          console.log(`${roleEmoji} ${user.name}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   Created: ${user.created_at}`);
          console.log('');
        });
      }

      console.log('✅ User setup complete!\n');
      console.log('Access Levels:');
      console.log('- admin@customworkforcesolutionsllc.com → Full access + audit trail history');
      console.log('- safety@customworkforcesolutionsllc.com → Standard recruiting access');

      db.close();
    });
  }, 1000);
});
