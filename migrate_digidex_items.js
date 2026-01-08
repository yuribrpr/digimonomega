const db = require('./backend/config/db');

async function migrate() {
  try {
    // Check if column exists
    const [columns] = await db.execute("SHOW COLUMNS FROM digidex LIKE 'required_item_id'");
    if (columns.length === 0) {
        console.log("Adding required_item_id column...");
        await db.execute("ALTER TABLE digidex ADD COLUMN required_item_id INT DEFAULT 12");
        console.log("Column added.");
    } else {
        console.log("Column required_item_id already exists.");
    }
    
    // Ensure required_evoluters is treated as required_item_quantity if we want to rename, 
    // but for now we can just use required_evoluters as the quantity field.
    // Maybe we should alias it or add a new column for clarity? 
    // User said "pergunte... quantidade". 
    // Let's add required_item_quantity and copy values from required_evoluters if it exists.
    
    const [cols2] = await db.execute("SHOW COLUMNS FROM digidex LIKE 'required_item_quantity'");
    if (cols2.length === 0) {
        console.log("Adding required_item_quantity column...");
        await db.execute("ALTER TABLE digidex ADD COLUMN required_item_quantity INT DEFAULT 0");
        // Copy data
        await db.execute("UPDATE digidex SET required_item_quantity = required_evoluters");
        console.log("Column added and data migrated.");
    } else {
         console.log("Column required_item_quantity already exists.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

migrate();
