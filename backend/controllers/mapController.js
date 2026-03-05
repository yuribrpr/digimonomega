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
  if (!names.includes('is_active')) {
    await db.execute('ALTER TABLE maps ADD COLUMN is_active TINYINT(1) DEFAULT 1');
  }
  if (!names.includes('difficulty')) {
    await db.execute('ALTER TABLE maps ADD COLUMN difficulty FLOAT DEFAULT 1.0');
  }
}

async function ensureSoundtrackColumns() {
  const [cols] = await db.execute('DESCRIBE maps');
  const names = cols.map(c => c.Field);
  if (!names.includes('soundtrack_url')) {
    await db.execute('ALTER TABLE maps ADD COLUMN soundtrack_url VARCHAR(1024) DEFAULT NULL');
  }
  if (!names.includes('soundtrack_path')) {
    await db.execute('ALTER TABLE maps ADD COLUMN soundtrack_path VARCHAR(255) DEFAULT NULL');
  }
}

async function ensureCampaignColumns() {
  const [cols] = await db.execute('DESCRIBE maps');
  const names = cols.map(c => c.Field);
  if (!names.includes('campaign_id')) {
    await db.execute('ALTER TABLE maps ADD COLUMN campaign_id INT DEFAULT NULL');
  }
}

async function ensureRouteColumns() {
  const [cols] = await db.execute('DESCRIBE maps');
  const names = cols.map(c => c.Field);
  if (!names.includes('route_order')) {
    await db.execute('ALTER TABLE maps ADD COLUMN route_order INT NOT NULL DEFAULT 0');
  }
  if (!names.includes('world_x')) {
    await db.execute('ALTER TABLE maps ADD COLUMN world_x DECIMAL(6,2) DEFAULT NULL');
  }
  if (!names.includes('world_y')) {
    await db.execute('ALTER TABLE maps ADD COLUMN world_y DECIMAL(6,2) DEFAULT NULL');
  }
}

function parseRouteOrderInput(value, fallback = 0) {
  if (value === undefined) return fallback;
  if (value === null || value === '') return 0;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error('route_order deve ser inteiro >= 0');
  }
  return parsed;
}

function parseWorldCoordInput(value, fallback, label) {
  if (value === undefined) return fallback;
  if (value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    throw new Error(`${label} deve estar entre 0 e 100`);
  }
  return parsed;
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

exports.getMapProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Não autenticado' });

    const [rows] = await db.execute(
      'SELECT map_id, completed_at FROM user_map_progress WHERE user_id = ? ORDER BY completed_at DESC',
      [userId]
    );

    const completedMapIds = [...new Set((rows || []).map(r => Number(r.map_id)).filter(Number.isFinite))];
    const records = (rows || []).map(r => ({
      map_id: Number(r.map_id),
      completed_at: r.completed_at
    }));

    res.json({ completedMapIds, records });
  } catch (error) {
    console.error('Erro ao buscar progresso dos mapas:', error);
    res.status(500).json({ message: 'Erro ao buscar progresso dos mapas', error: error.message });
  }
};

exports.createMap = async (req, res) => {
  try {
    const { name, min_level, description, enemies, require_item, required_item_id, consume_on_enter, type, is_active, difficulty, soundtrack_url, campaign_id, route_order, world_x, world_y } = req.body;
    const imageFile = req.files && req.files.image && req.files.image[0];
    const soundtrackFile = req.files && req.files.soundtrack && req.files.soundtrack[0];
    const image_path = imageFile ? `assets/maps/${imageFile.filename}` : null;
    const soundtrack_path = soundtrackFile ? `assets/maps/${soundtrackFile.filename}` : null;

    if (!name) return res.status(400).json({ message: 'Nome é obrigatório' });

    await ensureRequirementColumns();
    await ensureSoundtrackColumns();
    await ensureCampaignColumns();
    await ensureRouteColumns();

    const routeOrder = parseRouteOrderInput(route_order, 0);
    const worldX = parseWorldCoordInput(world_x, null, 'world_x');
    const worldY = parseWorldCoordInput(world_y, null, 'world_y');

    // Insert Map
    const [result] = await db.execute(
      'INSERT INTO maps (name, min_level, description, image_path, type, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name, 
        min_level || 1, 
        description, 
        image_path, 
        type || 'Campanha',
        is_active === 'true' || is_active === 1 || is_active === true ? 1 : 0
      ]
    );

    const mapId = result.insertId;

    // Set requirement fields (after insert to avoid dynamic columns list)
    await db.execute(
      'UPDATE maps SET require_item = ?, required_item_id = ?, consume_on_enter = ?, difficulty = ? WHERE id = ?',
      [
        require_item === 'true' || require_item === 1 || require_item === true ? 1 : 0,
        required_item_id ? Number(required_item_id) : null,
        consume_on_enter === 'true' || consume_on_enter === 1 || consume_on_enter === true ? 1 : 0,
        difficulty ? parseFloat(difficulty) : 1.0,
        mapId
      ]
    );
    let finalSoundtrackUrl = soundtrack_url || null;
    let finalSoundtrackPath = soundtrack_path || null;
    if (finalSoundtrackPath) finalSoundtrackUrl = null;
    await db.execute(
      'UPDATE maps SET soundtrack_url = ?, soundtrack_path = ? WHERE id = ?',
      [finalSoundtrackUrl, finalSoundtrackPath, mapId]
    );
    if (campaign_id !== undefined) {
      const cid = campaign_id ? Number(campaign_id) : null;
      await db.execute('UPDATE maps SET campaign_id = ? WHERE id = ?', [cid, mapId]);
    }
    await db.execute(
      'UPDATE maps SET route_order = ?, world_x = ?, world_y = ? WHERE id = ?',
      [routeOrder, worldX, worldY, mapId]
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
    const status = String(error.message || '').includes('route_order') || String(error.message || '').includes('world_') ? 400 : 500;
    res.status(status).json({ message: 'Erro ao criar mapa', error: error.message });
  }
};

exports.updateMap = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, min_level, description, enemies, require_item, required_item_id, consume_on_enter, type, is_active, difficulty, soundtrack_url, clear_soundtrack, campaign_id, route_order, world_x, world_y } = req.body;
    
    // Check if map exists
    const [existing] = await db.execute('SELECT * FROM maps WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Mapa não encontrado' });

    await ensureRequirementColumns();
    await ensureSoundtrackColumns();
    await ensureCampaignColumns();
    await ensureRouteColumns();

    const imageFile = req.files && req.files.image && req.files.image[0];
    const soundtrackFile = req.files && req.files.soundtrack && req.files.soundtrack[0];
    let image_path = existing[0].image_path;
    if (imageFile) {
        image_path = `assets/maps/${imageFile.filename}`;
    }
    let finalSoundtrackUrl = typeof soundtrack_url === 'string' ? (soundtrack_url || null) : existing[0].soundtrack_url || null;
    let finalSoundtrackPath = existing[0].soundtrack_path || null;
    if (soundtrackFile) {
        finalSoundtrackPath = `assets/maps/${soundtrackFile.filename}`;
        finalSoundtrackUrl = null;
    }
    if (String(clear_soundtrack).toLowerCase() === 'true') {
        finalSoundtrackUrl = null;
        finalSoundtrackPath = null;
    }

    // Update Map
    await db.execute(
      'UPDATE maps SET name = ?, min_level = ?, description = ?, image_path = ?, type = ?, is_active = ? WHERE id = ?',
      [
        name, 
        min_level || 1, 
        description, 
        image_path, 
        type || 'Campanha', 
        is_active === 'true' || is_active === 1 || is_active === true ? 1 : 0,
        id
      ]
    );

    // Update requirement fields
    await db.execute(
      'UPDATE maps SET require_item = ?, required_item_id = ?, consume_on_enter = ?, difficulty = ? WHERE id = ?',
      [
        require_item === 'true' || require_item === 1 || require_item === true ? 1 : 0,
        required_item_id ? Number(required_item_id) : null,
        consume_on_enter === 'true' || consume_on_enter === 1 || consume_on_enter === true ? 1 : 0,
        difficulty ? parseFloat(difficulty) : 1.0,
        id
      ]
    );
    await db.execute(
      'UPDATE maps SET soundtrack_url = ?, soundtrack_path = ? WHERE id = ?',
      [finalSoundtrackUrl, finalSoundtrackPath, id]
    );
    if (campaign_id !== undefined) {
      const cid = campaign_id ? Number(campaign_id) : null;
      await db.execute('UPDATE maps SET campaign_id = ? WHERE id = ?', [cid, id]);
    }

    const existingRouteOrder = Number(existing[0].route_order || 0);
    const existingWorldX = existing[0].world_x === null ? null : Number(existing[0].world_x);
    const existingWorldY = existing[0].world_y === null ? null : Number(existing[0].world_y);
    const routeOrder = parseRouteOrderInput(route_order, existingRouteOrder);
    const worldX = parseWorldCoordInput(world_x, existingWorldX, 'world_x');
    const worldY = parseWorldCoordInput(world_y, existingWorldY, 'world_y');

    await db.execute(
      'UPDATE maps SET route_order = ?, world_x = ?, world_y = ? WHERE id = ?',
      [routeOrder, worldX, worldY, id]
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
    const status = String(error.message || '').includes('route_order') || String(error.message || '').includes('world_') ? 400 : 500;
    res.status(status).json({ message: 'Erro ao atualizar mapa', error: error.message });
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
            SELECT e.id, e.name, e.difficulty, e.sprite_path, e.base_hp, e.base_attack 
            FROM map_enemies me
            JOIN enemydex e ON me.enemy_id = e.id
            WHERE me.map_id = ?
        `, [id]);
        
        res.json({ ...map, enemies });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar mapa', error: error.message });
    }
};
