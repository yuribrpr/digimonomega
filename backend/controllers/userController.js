const db = require('../config/db');
const bcrypt = require('bcrypt');

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
  const principalCol = pick(cols, ['principal', 'is_main', 'main', 'is_principal', 'principal_flag', 'primary', 'isPrimary']);
  return { table, cols, userIdCol, digiIdCol, principalCol };
}

exports.getUserDigimons = async (req, res) => {
  try {
    const { id } = req.params;
    const mapping = await resolveUserDigimonsTable();
    if (!mapping || !mapping.userIdCol || !mapping.digiIdCol) {
      return res.status(500).json({ message: 'Tabela users_digimons não encontrada ou colunas ausentes' });
    }
    const { table, userIdCol, digiIdCol, principalCol } = mapping;
  const principalSelect = principalCol ? `ud.${principalCol} as principal,` : '';
  const dbName = process.env.DB_NAME;
  const digidexTable = dbName ? `${dbName}.digidex` : 'digidex';
  const sql = `
      SELECT 
             ud.*, 
             ud.id as user_digimon_id,
             ud.${digiIdCol} as digimon_id, 
             ${principalSelect}
             d.id as digidex_id, 
             d.name as species_name, 
             d.type, d.base_hp, d.base_attack, d.base_defense, d.base_attack_speed, d.base_level, d.sprite_path
      FROM ${table} ud
      JOIN ${digidexTable} d ON d.id = ud.${digiIdCol}
      WHERE ud.${userIdCol} = ?`;
    const [rows] = await db.execute(sql, [id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar digimons do usuário', error: error.sqlMessage || error.message || String(error) });
  }
};

exports.setPrincipal = async (req, res) => {
  try {
    const { id } = req.params;
    const { digimon_id } = req.body;
    if (!digimon_id) return res.status(400).json({ message: 'digimon_id é obrigatório' });
    const mapping = await resolveUserDigimonsTable();
    if (!mapping || !mapping.userIdCol || !mapping.digiIdCol || !mapping.principalCol) {
      return res.status(500).json({ message: 'Tabela users_digimons ou coluna principal não encontrada' });
    }
    const { table, userIdCol, digiIdCol, principalCol } = mapping;
    await db.execute(`UPDATE ${table} SET ${principalCol} = 0 WHERE ${userIdCol} = ?`, [id]);
    await db.execute(`UPDATE ${table} SET ${principalCol} = 1 WHERE ${userIdCol} = ? AND ${digiIdCol} = ?`, [id, digimon_id]);
    res.json({ message: 'Digimon principal atualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao definir principal', error: error.sqlMessage || error.message || String(error) });
  }
};

exports.getTablesSchema = async (req, res) => {
  try {
    const dbName = process.env.DB_NAME;
    const mapping = await resolveUserDigimonsTable();
    if (!mapping) {
      return res.status(500).json({ message: 'Tabela users_digimons não encontrada' });
    }
    const { table } = mapping;
    const [userDescribe] = await db.execute(`DESCRIBE ${table}`);
    const [userCreateRows] = await db.execute(`SHOW CREATE TABLE ${table}`);
    const userCreate = userCreateRows && userCreateRows[0] && (userCreateRows[0]['Create Table'] || userCreateRows[0].CreateTable || '');
    const digidexTable = dbName ? `${dbName}.digidex` : 'digidex';
    const [digidexDescribe] = await db.execute(`DESCRIBE ${digidexTable}`);
    const [digidexCreateRows] = await db.execute(`SHOW CREATE TABLE ${digidexTable}`);
    const digidexCreate = digidexCreateRows && digidexCreateRows[0] && (digidexCreateRows[0]['Create Table'] || digidexCreateRows[0].CreateTable || '');
    res.json({
      users_digimons: { table, describe: userDescribe, create: userCreate },
      digidex: { table: digidexTable, describe: digidexDescribe, create: digidexCreate }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter schemas', error: error.sqlMessage || error.message || String(error) });
  }
};

exports.deleteUserDigimon = async (req, res) => {
  try {
    const { id, digimonId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Senha é obrigatória para confirmar.' });
    }

    // Verify user password
    const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    if (!users[0].password) {
        return res.status(500).json({ message: 'Erro de conta: Senha não configurada.' });
    }

    let isMatch = false;
    try {
        isMatch = await bcrypt.compare(password, users[0].password);
    } catch (e) {
        console.error('Bcrypt compare error:', e);
        return res.status(500).json({ message: 'Erro ao verificar senha.' });
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta.' });
    }

    const mapping = await resolveUserDigimonsTable();
    if (!mapping) {
        return res.status(500).json({ message: 'Erro interno: tabela não encontrada.' });
    }
    const { table, userIdCol } = mapping;

    // Verify ownership and existence
    const [rows] = await db.execute(`SELECT * FROM ${table} WHERE id = ? AND ${userIdCol} = ?`, [digimonId, id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'Digimon não encontrado ou não pertence a você.' });
    }

    // Delete associated battles first to avoid Foreign Key Constraint failure
    await db.execute('DELETE FROM battles WHERE user_digimon_id = ?', [digimonId]);

    await db.execute(`DELETE FROM ${table} WHERE id = ?`, [digimonId]);

    res.json({ message: 'Digimon abandonado com sucesso.' });
  } catch (error) {
    console.error('DeleteUserDigimon Error:', error);
    res.status(500).json({ message: `Erro ao abandonar digimon: ${error.message}` });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.execute('SELECT id, username, email, bits, profile_image, exp, exp_m, level FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }
        const userId = req.user.id;
        const filePath = `assets/avatars/${req.file.filename}`;
        
        await db.execute('UPDATE users SET profile_image = ? WHERE id = ?', [filePath, userId]);
        
        res.json({ message: 'Avatar atualizado com sucesso!', path: filePath });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao fazer upload', error: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Optional: Verify if role exists in roles table
    const [roles] = await db.execute('SELECT name FROM roles WHERE name = ?', [role]);
    if (roles.length === 0) {
        return res.status(400).json({ message: 'Role inválida' });
    }

    await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Role do usuário atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar role', error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const [rows] = await db.execute('SELECT id, username, level FROM users WHERE username LIKE ? LIMIT 10', [`%${q}%`]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error: error.message });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const [userRows] = await db.execute('SELECT id, username, level, created_at, role, profile_image, exp, exp_m FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = userRows[0];

    // Reuse getUserDigimons logic logic or call it internally if refactored, but here I'll just copy the query logic for simplicity and speed
    const mapping = await resolveUserDigimonsTable();
    let digimons = [];
    if (mapping) {
        const { table, userIdCol, digiIdCol, principalCol } = mapping;
        const principalSelect = principalCol ? `ud.${principalCol} as principal,` : '';
        const dbName = process.env.DB_NAME;
        const digidexTable = dbName ? `${dbName}.digidex` : 'digidex';
        const sql = `
            SELECT 
                ud.*, 
                ud.id as user_digimon_id,
                ud.${digiIdCol} as digimon_id, 
                ${principalSelect}
                d.id as digidex_id, 
                d.name as species_name, 
                d.type, d.base_hp, d.base_attack, d.base_defense, d.base_attack_speed, d.base_level, d.sprite_path
            FROM ${table} ud
            JOIN ${digidexTable} d ON d.id = ud.${digiIdCol}
            WHERE ud.${userIdCol} = ?`;
        const [dRows] = await db.execute(sql, [id]);
        digimons = dRows;
    }

    res.json({ user, digimons });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Admin check should be middleware, but for now assuming route protection or checking here if needed.
    // The prompt says "exceto senha".
    const [rows] = await db.execute('SELECT id, username, email, bits, level, role, created_at, last_seen_at FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all users', error: error.message });
  }
};

exports.updateUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { level, bits, role, username, email } = req.body;
    // Assuming admin check is done in routes
    await db.execute('UPDATE users SET level = ?, bits = ?, role = ?, username = ?, email = ? WHERE id = ?', [level, bits, role, username, email, id]);
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

exports.deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    // Delete user digimons first
    const mapping = await resolveUserDigimonsTable();
    if (mapping) {
        const { table, userIdCol } = mapping;
        await db.execute(`DELETE FROM ${table} WHERE ${userIdCol} = ?`, [id]);
    }
    // Delete inventory
    await db.execute('DELETE FROM inventory WHERE user_id = ?', [id]);
    // Delete user
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

exports.adminGiveItem = async (req, res) => {
  try {
    const { userId, itemId, quantity } = req.body;
    await db.execute('INSERT INTO inventory (user_id, item_id, quantity) VALUES (?, ?, ?)', [userId, itemId, quantity]);
    res.json({ message: 'Item sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending item', error: error.message });
  }
};

exports.adminGiveDigimon = async (req, res) => {
  try {
    const { userId, digidexId, level, nickname } = req.body;
    const mapping = await resolveUserDigimonsTable();
    if (!mapping) return res.status(500).json({ message: 'Table error' });
    const { table } = mapping;
    
    // Get base stats to calculate current stats based on level (simplified for now, just base stats)
    const [dRows] = await db.execute('SELECT * FROM digidex WHERE id = ?', [digidexId]);
    if (dRows.length === 0) return res.status(404).json({ message: 'Digimon not found in Digidex' });
    const digi = dRows[0];
    
    // Simple stat calc (base + level * 10 for example, or just base for now)
    const hp = digi.base_hp + (level * 10);
    const atk = digi.base_attack + (level * 2);
    const def = digi.base_defense + (level * 2);
    const spd = digi.base_attack_speed || 2.0;

    await db.execute(`INSERT INTO ${table} (user_id, digidex_id, nickname, level, current_hp, max_hp, attack, defense, attack_speed, is_main) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`, 
        [userId, digidexId, nickname || digi.name, level, hp, hp, atk, def, spd]);

    res.json({ message: 'Digimon sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending digimon', error: error.message });
  }
};

exports.adminRemoveDigimon = async (req, res) => {
    try {
        const { id } = req.params; // Digimon ID (user_digimon_id)
        const mapping = await resolveUserDigimonsTable();
        if (!mapping) return res.status(500).json({ message: 'Table error' });
        const { table } = mapping;
        await db.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
        res.json({ message: 'Digimon removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing digimon', error: error.message });
    }
};
