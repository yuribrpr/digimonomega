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
    
    // Add enemy_id FK pointing to enemydex
    try {
      await connection.execute('ALTER TABLE battles ADD CONSTRAINT battles_ibfk_3 FOREIGN KEY (enemy_id) REFERENCES enemydex(id) ON DELETE CASCADE');
      console.log('Foreign key battles_ibfk_3 added successfully (referencing enemydex).');
    } catch (err) {
       console.log('Error adding battles_ibfk_3:', err.message);
    }


  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await connection.end();
  }
}

fixFK();
