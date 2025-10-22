const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔐 Adding new user and correcting existing user name...\n');

db.serialize(async () => {
  try {
    // 1. Correct existing user's name from "Abonie Cavil" to "Abeni Cavil"
    db.run(`
      UPDATE users
      SET name = ?
      WHERE email = ?
    `, ['Abeni Cavil', 'acavil@customworkforcesolutionsllc.com'], (err) => {
      if (err) {
        console.error('❌ Error updating existing user name:', err);
      } else {
        console.log('✅ Corrected name: Abonie Cavil → Abeni Cavil');
      }
    });

    // 2. Create new user: Fabien Perdomo
    const email = 'safety@customworkforcesolutionsllc.com';
    const password = 'Safety123!';
    const name = 'Fabien Perdomo';

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    db.run(`
      INSERT OR REPLACE INTO users (email, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `, [email, passwordHash, name, 'recruiter'], (err) => {
      if (err) {
        console.error('❌ Error creating new user:', err);
      } else {
        console.log('✅ New user created successfully\n');
        console.log('👤 New User Account:');
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
            console.log('\n✅ All changes complete!');
            console.log('\n📝 User Summary:');
            console.log('\n1️⃣  Abeni Cavil');
            console.log('   Email: acavil@customworkforcesolutionsllc.com');
            console.log('   Password: Abeni123!');
            console.log('');
            console.log('2️⃣  Fabien Perdomo (NEW)');
            console.log('   Email: safety@customworkforcesolutionsllc.com');
            console.log('   Password: Safety123!');
          }
        });
      }, 1000);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }
});
