const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔐 Setting up authentication system...\n');

db.serialize(async () => {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'recruiter',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err);
    } else {
      console.log('✅ Users table created successfully');
    }
  });

  // Hash password and create initial user
  const email = 'acavil@customworkforcesolutionsllc.com';
  const password = 'Abeni123!';
  const name = 'Abonie Cavil';

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    db.run(`
      INSERT OR REPLACE INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `, [email, passwordHash, name, 'recruiter'], (err) => {
      if (err) {
        console.error('❌ Error creating user:', err);
      } else {
        console.log('✅ User created successfully');
        console.log('');
        console.log('👤 User Account:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Name: ${name}`);
        console.log(`   Role: recruiter`);
      }

      // Close database after operations
      setTimeout(() => {
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('\n✅ Authentication setup complete!');
            console.log('\n📝 Next steps:');
            console.log('   1. Restart the server: npm start');
            console.log('   2. Navigate to: http://localhost:3000/login.html');
            console.log('   3. Login with the credentials above');
            console.log('   4. Access job posting at: http://localhost:3000/jobs.html');
          }
        });
      }, 1000);
    });
  } catch (error) {
    console.error('❌ Error hashing password:', error);
  }
});
