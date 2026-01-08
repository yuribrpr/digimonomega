const db = require('../config/db');

async function listTables() {
  const dbName = process.env.DB_NAME;
  const [rows] = await db.execute(dbName ? `SHOW TABLES FROM ${dbName}` : 'SHOW TABLES');
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const key = keys.find(k => k.toLowerCase().includes('tables_in'));
  return rows.map(r => r[key]);
}

async function getColumns(table) {
  const [rows] = await db.execute(`DESCRIBE ${table}`);
  return rows || [];
}

function pick(cols, candidates) {
  for (const c of candidates) {
    if (cols.find(col => col.Field === c)) return c;
  }
  return null;
}

async function resolveUserDigimonsTable() {
  const tables = await listTables();
  const table = tables.find(t => t.toLowerCase() === 'users_digimons') ||
                tables.find(t => t.toLowerCase() === 'user_digimons') ||
                tables.find(t => /user.*digimon/i.test(t));
  if (!table) return null;
  const cols = await getColumns(table);
  const userIdCol = pick(cols, ['user_id', 'usuario_id', 'id_usuario', 'users_id', 'id_user', 'userId', 'usuarioId', 'idUser']);
  const digiIdCol = pick(cols, [
    'digidex_id', 'id_digidex',
    'digimon_id', 'id_digimon',
    'species_id',
    'digimonId', 'idDigimon',
    'id_digi', 'digi_id'
  ]);
  return { table, cols, userIdCol, digiIdCol };
}

exports.getRanking = async (req, res) => {
    try {
        const mapping = await resolveUserDigimonsTable();
        if (!mapping || !mapping.userIdCol || !mapping.digiIdCol) {
            return res.status(500).json({ message: 'Tabela users_digimons não encontrada ou colunas ausentes' });
        }
        const { table, userIdCol, digiIdCol } = mapping;
        const dbName = process.env.DB_NAME;
        const digidexTable = dbName ? `${dbName}.digidex` : 'digidex';
        const usersTable = dbName ? `${dbName}.users` : 'users';

        // Calculate total power: XP + Attack + Defense
        // Note: Assuming 'xp', 'attack', 'defense' exist in user_digimons table based on previous context.
        // If attack/defense are not in user_digimons, we might need to use base stats + level calculation, 
        // but typically RPGs store current stats in the instance.
        // Let's verify columns exist or fallback to something safe.
        
        // Checking if attack/defense columns exist in user_digimons table
        const hasAttack = mapping.cols.find(c => c.Field === 'attack');
        const hasDefense = mapping.cols.find(c => c.Field === 'defense');
        const hasXp = mapping.cols.find(c => c.Field === 'xp');
        
        // Construct the power calculation
        let powerCalc = '0';
        if (hasXp) powerCalc += ' + ud.xp';
        if (hasAttack) powerCalc += ' + ud.attack';
        if (hasDefense) powerCalc += ' + ud.defense';
        
        // If no stats columns in instance, this ranking might be weird, but let's assume they exist as it's an RPG.
        
        const sql = `
            SELECT 
                ud.*,
                u.username as owner_name,
                d.name as species_name,
                d.sprite_path,
                (${powerCalc}) as total_power
            FROM ${table} ud
            JOIN ${usersTable} u ON ud.${userIdCol} = u.id
            JOIN ${digidexTable} d ON ud.${digiIdCol} = d.id
            ORDER BY total_power DESC, ud.level DESC
            LIMIT 10
        `;
        
        const [rows] = await db.execute(sql);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching ranking:', error);
        res.status(500).json({ message: 'Error fetching ranking' });
    }
};

exports.getAllDigimons = async (req, res) => {
    try {
        const [digimons] = await db.execute('SELECT * FROM digidex');
        res.json(digimons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching digimons' });
    }
};

exports.createDigimon = async (req, res) => {
    try {
        const { 
            name, type, base_hp, base_attack, base_defense,
            evolution_line_id, next_evolution_id, evolution_level, base_level 
        } = req.body;
        
        const sprite_path = req.file ? `assets/sprites/${req.file.filename}` : null;

        const nextEvoId = next_evolution_id || null;
        const evoLevel = evolution_level || null;
        const bLevel = base_level || 1;

        const [result] = await db.execute(
            'INSERT INTO digidex (name, type, base_hp, base_attack, base_defense, evolution_line_id, next_evolution_id, evolution_level, base_level, sprite_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, type, base_hp, base_attack, base_defense, evolution_line_id, nextEvoId, evoLevel, bLevel, sprite_path]
        );
        res.status(201).json({ message: 'Digimon created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating digimon' });
    }
};

exports.updateDigimon = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, type, base_hp, base_attack, base_defense,
            evolution_line_id, next_evolution_id, evolution_level, base_level
        } = req.body;
        
        const nextEvoId = next_evolution_id || null;
        const evoLevel = evolution_level || null;
        const bLevel = base_level || 1;

        let query = 'UPDATE digidex SET name=?, type=?, base_hp=?, base_attack=?, base_defense=?, evolution_line_id=?, next_evolution_id=?, evolution_level=?, base_level=?';
        let params = [name, type, base_hp, base_attack, base_defense, evolution_line_id, nextEvoId, evoLevel, bLevel];

        if (req.file) {
            query += ', sprite_path=?';
            params.push(`assets/sprites/${req.file.filename}`);
        }

        query += ' WHERE id=?';
        params.push(id);

        await db.execute(query, params);
        res.json({ message: 'Digimon updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating digimon' });
    }
};

exports.deleteDigimon = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM digidex WHERE id = ?', [id]);
        res.json({ message: 'Digimon deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting digimon' });
    }
};
