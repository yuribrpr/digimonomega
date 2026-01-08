const db = require('./config/db');

async function run() {
  try {
    // Check if columns exist first to avoid errors
    const [columns] = await db.execute("DESCRIBE users");
    const hasRole = columns.some(c => c.Field === 'role');
    const hasLevel = columns.some(c => c.Field === 'level');

    if (!hasRole) {
      await db.execute("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'");
      console.log('Column role added');
    } else {
      console.log('Column role already exists');
    }

    if (!hasLevel) {
      await db.execute("ALTER TABLE users ADD COLUMN level INT DEFAULT 1");
      console.log('Column level added');
    } else {
      console.log('Column level already exists');
    }

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();