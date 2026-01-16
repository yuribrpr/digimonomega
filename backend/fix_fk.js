const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function fixFK() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('Connected to database...');
    
    // Ensure enemy_id FK on battles points to enemydex in current DB
    try {
      await connection.execute('ALTER TABLE battles ADD CONSTRAINT battles_ibfk_3 FOREIGN KEY (enemy_id) REFERENCES enemydex(id) ON DELETE CASCADE');
      console.log('Foreign key battles_ibfk_3 added successfully (referencing enemydex).');
    } catch (err) {
       console.log('Error adding battles_ibfk_3:', err.message);
    }

    // Fix inventory FKs to reference current DB tables
    try {
      console.log('Dropping inventory_ibfk_1 (if exists)...');
      await connection.execute('ALTER TABLE inventory DROP FOREIGN KEY inventory_ibfk_1');
      console.log('inventory_ibfk_1 dropped.');
    } catch (err) {
      console.log('Error dropping inventory_ibfk_1 (might not exist):', err.message);
    }

    try {
      console.log('Dropping inventory_ibfk_2 (if exists)...');
      await connection.execute('ALTER TABLE inventory DROP FOREIGN KEY inventory_ibfk_2');
      console.log('inventory_ibfk_2 dropped.');
    } catch (err) {
      console.log('Error dropping inventory_ibfk_2 (might not exist):', err.message);
    }

    try {
      console.log('Adding inventory_ibfk_1 referencing users(id)...');
      await connection.execute('ALTER TABLE inventory ADD CONSTRAINT inventory_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      console.log('inventory_ibfk_1 added successfully.');
    } catch (err) {
      console.log('Error adding inventory_ibfk_1:', err.message);
    }

    try {
      console.log('Adding inventory_ibfk_2 referencing items(id)...');
      await connection.execute('ALTER TABLE inventory ADD CONSTRAINT inventory_ibfk_2 FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE');
      console.log('inventory_ibfk_2 added successfully.');
    } catch (err) {
      console.log('Error adding inventory_ibfk_2:', err.message);
    }


  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await connection.end();
  }
}

fixFK();
