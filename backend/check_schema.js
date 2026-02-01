const db = require('./config/db');

async function checkSchema() {
  try {
    const [tables] = await db.execute("SHOW TABLES LIKE '%user%digimon%'");
    const table = tables.length > 0 ? Object.values(tables[0])[0] : 'users_digimons';
    console.log('Table:', table);
    const [cols] = await db.execute(`DESCRIBE ${table}`);
    console.log(cols.map(c => c.Field));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkSchema();
