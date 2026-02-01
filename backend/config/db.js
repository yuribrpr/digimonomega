const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Adicione a porta (TiDB costuma usar 4000, MySQL padrão 3306)
  port: process.env.DB_PORT || 3306, 
  // AQUI ESTÁ A CORREÇÃO MÁGICA 👇
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const checkConnection = async (retries = 5, delay = 5000) => {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error(`Database connection failed (Code: ${err.code}). Retrying in ${delay/1000}s...`);
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.error('Database connection was closed.');
            }
            if (err.code === 'ER_CON_COUNT_ERROR') {
                console.error('Database has too many connections.');
            }
            if (err.code === 'ECONNREFUSED') {
                console.error('Database connection was refused.');
            }
            // Recursively retry
            setTimeout(() => checkConnection(retries, delay), delay);
        } else {
            if (connection) {
                console.log('✅ Database connected successfully!');
                connection.release();
            }
        }
    });
};

checkConnection();

module.exports = pool.promise();