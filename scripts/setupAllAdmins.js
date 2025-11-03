const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Setting up all admin accounts for Custom Workforce Solutions LLC...\n');

db.serialize(async () => {
  // Array of all admin accounts to create
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

  let completedCount = 0;
  const totalAdmins = admins.length;

  admins.forEach((admin, index) => {
    bcrypt.hash(admin.password, 10, (err, hash) => {
      if (err) {
        console.error(`❌ Error hashing password for ${admin.name}:`, err);
        completedCount++;
        return;
      }

      db.run(`
        INSERT INTO users (name, email, password_hash, role)
        SELECT ?, ?, ?, 'admin'
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = ?)
      `, [admin.name, admin.email, hash, admin.email], function(err) {
        if (err) {
          console.error(`❌ Error creating ${admin.name}:`, err);
        } else if (this.changes > 0) {
          console.log(`✅ ${admin.name} created`);
          console.log(`   Email: ${admin.email}`);
          console.log(`   Password: ${admin.password}`);
          console.log(`   Role: admin\n`);
        } else {
          console.log(`ℹ️  ${admin.name} already exists (${admin.email})\n`);
        }

        completedCount++;

        // When all admins are processed, show summary
        if (completedCount === totalAdmins) {
          setTimeout(() => {
            console.log('\n📋 All Admin Accounts:\n');
            db.all(`SELECT id, name, email, role, created_at FROM users WHERE role = 'admin' ORDER BY email`, (err, users) => {
              if (err) {
                console.error('Error fetching admin users:', err);
              } else {
                users.forEach(user => {
                  console.log(`👑 ${user.name}`);
                  console.log(`   Email: ${user.email}`);
                  console.log(`   Created: ${user.created_at}\n`);
                });
              }

              console.log('✅ Admin setup complete!\n');
              console.log('All accounts have full admin access including:');
              console.log('- Full access to resume screening');
              console.log('- Audit trail and history');
              console.log('- User management');
              console.log('- System settings\n');
              console.log('Login at: https://web-production-0c3fb.up.railway.app/login.html\n');

              db.close();
            });
          }, 500);
        }
      });
    });
  });
});
