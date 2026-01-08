const db = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

async function createTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS enemy_drops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        enemy_id INT NOT NULL,
        item_id INT NOT NULL,
        drop_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        FOREIGN KEY (enemy_id) REFERENCES enemydex(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `;
    
    await db.execute(createTableQuery);
    console.log("Tabela 'enemy_drops' criada ou já existente.");
    process.exit();
  } catch (error) {
    console.error("Erro ao criar tabela:", error);
    process.exit(1);
  }
}

createTable();
