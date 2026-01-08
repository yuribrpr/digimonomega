const db = require('./config/db');

async function migrate() {
    try {
        const [rows] = await db.execute("SHOW COLUMNS FROM chat_messages LIKE 'is_read'");
        if (rows.length === 0) {
            console.log("Adding is_read column...");
            await db.execute("ALTER TABLE chat_messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE");
            console.log("Column added.");
        } else {
            console.log("Column is_read already exists.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
