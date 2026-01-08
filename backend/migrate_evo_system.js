require('dotenv').config();
const db = require('./config/db');

async function migrate() {
  try {
    console.log('Starting migration for Evolution System...');

    // 1. Add required_evoluters to digidex
    const [digidexCols] = await db.execute("DESCRIBE digidex");
    if (!digidexCols.find(c => c.Field === 'required_evoluters')) {
      console.log('Adding required_evoluters to digidex...');
      await db.execute("ALTER TABLE digidex ADD COLUMN required_evoluters INT DEFAULT 0");
    } else {
      console.log('digidex.required_evoluters already exists.');
    }

    // 2. Add unlocked_evolutions to user_digimons
    // First find the table name
    const [tables] = await db.execute("SHOW TABLES");
    const tableList = tables.map(t => Object.values(t)[0]);
    const userDigiTable = tableList.find(t => t.includes('user') && t.includes('digimon'));

    if (userDigiTable) {
        const [udCols] = await db.execute(`DESCRIBE ${userDigiTable}`);
        if (!udCols.find(c => c.Field === 'unlocked_evolutions')) {
            console.log(`Adding unlocked_evolutions to ${userDigiTable}...`);
            // Storing as JSON array string, e.g. "[1, 5]"
            await db.execute(`ALTER TABLE ${userDigiTable} ADD COLUMN unlocked_evolutions TEXT`);
            
            // Initialize existing rows?
            // For now, let's assume currently equipped digimon is unlocked. 
            // We'll handle initialization logic in the application or here.
            // Let's set it to include the current digidex_id for all rows.
            await db.execute(`UPDATE ${userDigiTable} SET unlocked_evolutions = JSON_ARRAY(digidex_id)`);
        } else {
            console.log(`${userDigiTable}.unlocked_evolutions already exists.`);
        }
    } else {
        console.error('Could not find user_digimons table.');
    }

    console.log('Migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
