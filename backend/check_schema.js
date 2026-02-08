
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from backend directory
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

async function checkSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'digimon',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database.');

    const [rows] = await connection.execute('DESCRIBE enemydex');
    console.log('Columns in enemydex table:');
    rows.forEach(row => {
        console.log(`${row.Field} (${row.Type})`);
    });

    const [enemies] = await connection.execute('SELECT id, name, base_level, sprite_path FROM enemydex LIMIT 5');
    console.log('\nSample enemies:');
    console.table(enemies);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSchema();
