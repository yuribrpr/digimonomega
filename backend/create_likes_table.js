const db = require('./config/db');

async function createLikesTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS news_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        news_id INT NOT NULL,
        user_id INT NOT NULL,
        is_like BOOLEAN NOT NULL, -- TRUE = like, FALSE = dislike
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_news_like (news_id, user_id),
        FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('Table news_likes created successfully or already exists');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    process.exit();
  }
}

createLikesTable();
