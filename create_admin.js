// script to create admin user manually
const { getDatabase } = require('./src/lib/database');
const { hashPassword } = require('./src/lib/auth');

async function createAdminUser() {
  const db = getDatabase();

  // Hash the password
  const hashedPassword = await hashPassword('Moh@9801');
  const now = new Date().toISOString();

  // Insert the admin user if not exists
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO users 
    (id, username, password, role, fullName, email, isActive, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    'admin_1',
    'super',
    hashedPassword,
    'admin',
    'مدير النظام',
    'admin@warehouse.local',
    1,
    now,
    now
  );

  console.log('Admin user created successfully with:');
  console.log('Username: super');
  console.log('Password: Moh@9801');

  db.close();
}

createAdminUser().catch(console.error);