const db = require('../config/db');

async function ensureRequirementColumns() {
  const [cols] = await db.execute('DESCRIBE maps');
  const names = cols.map(c => c.Field);
  if (!names.includes('require_item')) {
    await db.execute('ALTER TABLE maps ADD COLUMN require_item TINYINT(1) DEFAULT 0');
  }
  if (!names.includes('required_item_id')) {
    await db.execute('ALTER TABLE maps ADD COLUMN required_item_id INT DEFAULT NULL');
  }
  if (!names.includes('consume_on_enter')) {
    await db.execute('ALTER TABLE maps ADD COLUMN consume_on_enter TINYINT(1) DEFAULT 0');
  }
  if (!names.includes('type')) {
    await db.execute("ALTER TABLE maps ADD COLUMN type VARCHAR(50) DEFAULT 'Campanha'");
  }
}

exports.getAllMaps = async (req, res) => {
  try {
    const [maps] = await db.execute('SELECT * FROM maps ORDER BY min_level ASC');
    
    // Fetch enemies for each map
    const mapsWithEnemies = await Promise.all(maps.map(async (map) => {
        const [enemies] = await db.execute(`
            SELECT e.id, e.name, e.difficulty 
            FROM map_enemies me
            JOIN enemydex e ON me.enemy_id = e.id
            WHERE me.map_id = ?
        `, [map.id]);
        return { ...map, enemies };
    }));

    res.json(mapsWithEnemies);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar mapas', error: error.message });
  }
};

exports.createMap = async (req, res) => {
  try {
    const { name, min_level, description, enemies, require_item, required_item_id, consume_on_enter, type } = req.body;
    const image_path = req.file ? `assets/maps/${req.file.filename}` : null;

    if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });

    await ensureRequirementColumns();

    // Insert Map
    const [result] = await db.execute(
      'INSERT INTO maps (name, min_level, description, image_path, type) VALUES (?, ?, ?, ?, ?)',
      [name, min_level || 1, description, image_path, type || 'Campanha']
    );

    const mapId = result.insertId;

    // Set requirement fields (after insert to avoid dynamic columns list)
    await db.execute(
      'UPDATE maps SET require_item = ?, required_item_id = ?, consume_on_enter = ? WHERE id = ?',
      [
        require_item === 'true' || require_item === 1 || require_item === true ? 1 : 0,
        required_item_id ? Number(required_item_id) : null,
        consume_on_enter === 'true' || consume_on_enter === 1 || consume_on_enter === true ? 1 : 0,
        mapId
      ]
    );

    // Insert Enemies
    if (enemies) {
        // enemies can be a JSON string if sent via FormData
        let enemyIds = [];
        try {
            enemyIds = typeof enemies === 'string' ? JSON.parse(enemies) : enemies;
        } catch (e) {
            enemyIds = [enemies]; // fallback
        }

        if (Array.isArray(enemyIds) && enemyIds.length > 0) {
            const values = enemyIds.map(id => `(${mapId}, ${id})`).join(', ');
            await db.execute(`INSERT INTO map_enemies (map_id, enemy_id) VALUES ${values}`);
        }
    }

    res.status(201).json({ message: 'Mapa criado com sucesso', id: mapId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar mapa', error: error.message });
  }
};

exports.updateMap = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, min_level, description, enemies, require_item, required_item_id, consume_on_enter, type } = req.body;
    
    // Check if map exists
    const [existing] = await db.execute('SELECT * FROM maps WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Mapa não encontrado' });

    await ensureRequirementColumns();

    let image_path = existing[0].image_path;
    if (req.file) {
        image_path = `assets/maps/${req.file.filename}`;
    }

    // Update Map
    await db.execute(
      'UPDATE maps SET name = ?, min_level = ?, description = ?, image_path = ?, type = ? WHERE id = ?',
      [name, min_level || 1, description, image_path, type || 'Campanha', id]
    );

    // Update requirement fields
    await db.execute(
      'UPDATE maps SET require_item = ?, required_item_id = ?, consume_on_enter = ? WHERE id = ?',
      [
        require_item === 'true' || require_item === 1 || require_item === true ? 1 : 0,
        required_item_id ? Number(required_item_id) : null,
        consume_on_enter === 'true' || consume_on_enter === 1 || consume_on_enter === true ? 1 : 0,
        id
      ]
    );

    // Update Enemies
    if (enemies) {
        // Clear existing enemies
        await db.execute('DELETE FROM map_enemies WHERE map_id = ?', [id]);

        let enemyIds = [];
        try {
            enemyIds = typeof enemies === 'string' ? JSON.parse(enemies) : enemies;
        } catch (e) {
            enemyIds = [enemies]; // fallback
        }

        if (Array.isArray(enemyIds) && enemyIds.length > 0) {
            const values = enemyIds.map(enemyId => `(${id}, ${enemyId})`).join(', ');
            await db.execute(`INSERT INTO map_enemies (map_id, enemy_id) VALUES ${values}`);
        }
    }

    res.json({ message: 'Mapa atualizado com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar mapa', error: error.message });
  }
};

exports.deleteMap = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM map_enemies WHERE map_id = ?', [id]);
    await db.execute('DELETE FROM maps WHERE id = ?', [id]);
    res.json({ message: 'Mapa excluído com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir mapa', error: error.message });
  }
};

exports.getMapById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.execute('SELECT * FROM maps WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Mapa não encontrado' });
        
        const map = rows[0];
        const [enemies] = await db.execute(`
            SELECT e.id, e.name, e.difficulty, e.sprite_path, e.hp, e.attack 
            FROM map_enemies me
            JOIN enemydex e ON me.enemy_id = e.id
            WHERE me.map_id = ?
        `, [id]);
        
        res.json({ ...map, enemies });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar mapa', error: error.message });
    }
};
