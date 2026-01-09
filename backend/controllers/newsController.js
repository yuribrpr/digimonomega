const db = require('../config/db');

exports.createNews = async (req, res) => {
  const { title, content, type, publisher, is_pinned } = req.body;
  
  if (!title || !content || !publisher) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO news (title, content, type, publisher, is_pinned) VALUES (?, ?, ?, ?, ?)',
      [title, content, type || 'news', publisher, is_pinned || false]
    );
    res.status(201).json({ id: result.insertId, title, content, type, publisher, is_pinned: is_pinned || false });
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    res.status(500).json({ message: 'Erro ao criar notícia' });
  }
};

exports.getAllNews = async (req, res) => {
  try {
    const query = `
      SELECT n.*,
        (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id AND is_like = TRUE) as likes_count,
        (SELECT COUNT(*) FROM news_likes WHERE news_id = n.id AND is_like = FALSE) as dislikes_count,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('user_id', u.id, 'username', u.username, 'is_like', nl.is_like)
          )
          FROM news_likes nl
          JOIN users u ON nl.user_id = u.id
          WHERE nl.news_id = n.id
        ) as interactions
      FROM news n
      ORDER BY n.is_pinned DESC, n.created_at DESC
    `;
    const [news] = await db.query(query);
    
    // Parse interactions if it comes as string (depending on mysql driver version)
    // mysql2 usually returns JSON as object, but sometimes string if not configured.
    // We can map over it just in case.
    const processedNews = news.map(item => ({
        ...item,
        interactions: item.interactions || []
    }));

    res.json(processedNews);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    res.status(500).json({ message: 'Erro ao buscar notícias' });
  }
};

exports.updateNews = async (req, res) => {
  const { id } = req.params;
  const { title, content, type, publisher, is_pinned } = req.body;

  if (!title || !content || !publisher) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  try {
    await db.query(
      'UPDATE news SET title = ?, content = ?, type = ?, publisher = ?, is_pinned = ? WHERE id = ?',
      [title, content, type, publisher, is_pinned || false, id]
    );
    res.json({ id, title, content, type, publisher, is_pinned });
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error);
    res.status(500).json({ message: 'Erro ao atualizar notícia' });
  }
};

exports.deleteNews = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM news WHERE id = ?', [id]);
        res.json({ message: 'Notícia deletada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar notícia:', error);
        res.status(500).json({ message: 'Erro ao deletar notícia' });
    }
};

exports.toggleLike = async (req, res) => {
    const { id } = req.params; // news id
    const { is_like } = req.body; // true = like, false = dislike
    const userId = req.user.id;

    if (is_like === undefined) {
        return res.status(400).json({ message: 'is_like field is required' });
    }

    try {
        // Check if exists
        const [existing] = await db.query(
            'SELECT * FROM news_likes WHERE news_id = ? AND user_id = ?',
            [id, userId]
        );

        if (existing.length > 0) {
            if (Boolean(existing[0].is_like) === Boolean(is_like)) {
                // Remove (toggle off)
                await db.query('DELETE FROM news_likes WHERE id = ?', [existing[0].id]);
                return res.json({ message: 'Removed', action: 'removed' });
            } else {
                // Update (switch)
                await db.query('UPDATE news_likes SET is_like = ? WHERE id = ?', [is_like, existing[0].id]);
                return res.json({ message: 'Updated', action: 'updated' });
            }
        } else {
            // Insert
            await db.query(
                'INSERT INTO news_likes (news_id, user_id, is_like) VALUES (?, ?, ?)',
                [id, userId, is_like]
            );
            return res.json({ message: 'Added', action: 'added' });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'Error processing like/dislike' });
    }
};
