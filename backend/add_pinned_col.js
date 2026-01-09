const db = require('./config/db');

async function addPinnedColumn() {
  try {
    await db.query(`
      ALTER TABLE news
      ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    `);
    console.log('Column is_pinned added successfully');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column is_pinned already exists');
    } else {
      console.error('Error adding column:', error);
    }
  } finally {
    process.exit();
  }
}

addPinnedColumn();
