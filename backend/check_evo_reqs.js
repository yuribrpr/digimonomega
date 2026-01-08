const db = require('./config/db');

async function check() {
  try {
    const [rows] = await db.execute("SELECT * FROM items WHERE name LIKE '%Evoluter%'");
    console.log('Items found:', rows);
    
    // Also check tables schema
    const [digidexCols] = await db.execute("DESCRIBE digidex");
    console.log('Digidex columns:', digidexCols.map(c => c.Field));
    
    // Resolve user digimons table
    const [tables] = await db.execute("SHOW TABLES");
    const tableList = tables.map(t => Object.values(t)[0]);
    const userDigiTable = tableList.find(t => t.includes('user') && t.includes('digimon'));
    
    if (userDigiTable) {
        const [udCols] = await db.execute(`DESCRIBE ${userDigiTable}`);
        console.log(`${userDigiTable} columns:`, udCols.map(c => c.Field));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
