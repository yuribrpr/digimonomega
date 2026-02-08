const db = require('../config/db');
const dbName = process.env.DB_NAME;
const enemyTable = dbName ? `${dbName}.enemydex` : 'enemydex';

async function getColumns() {
  const [rows] = await db.execute(`DESCRIBE ${enemyTable}`);
  return rows;
}

function chooseColumn(columns, candidates) {
  for (const c of candidates) {
    if (columns.find(col => col.Field === c)) return c;
  }
  return null;
}

exports.getAllEnemies = async (req, res) => {
  try {
    const [enemies] = await db.execute(`SELECT * FROM ${enemyTable}`);
    res.json(enemies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching enemies' });
  }
};

exports.getSchema = async (req, res) => {
  try {
    const [describeRows] = await db.execute(`DESCRIBE ${enemyTable}`);
    const [createRows] = await db.execute(`SHOW CREATE TABLE ${enemyTable}`);
    const create = createRows && createRows[0] && (createRows[0]['Create Table'] || createRows[0].CreateTable || '');
    res.json({ describe: describeRows, create });
  } catch (error) {
    console.error('GetSchema Error:', error);
    res.status(500).json({ message: 'Error getting schema', error: error.message || String(error) });
  }
};
exports.createEnemy = async (req, res) => {
  try {
    const {
      name, type, difficulty, base_hp, base_attack, base_defense, base_level, stage, exp_reward, bits_reward, attack_speed
    } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Missing required fields', error: 'name and type are required' });
    }

    const sprite_path = req.file ? `assets/sprites/enemies/${req.file.filename}` : null;
    const bHp = base_hp ? parseInt(base_hp, 10) : 0;
    const bAtk = base_attack ? parseInt(base_attack, 10) : 0;
    const bDef = base_defense ? parseInt(base_defense, 10) : 0;
    const bSpd = attack_speed ? parseFloat(attack_speed) : 2.0;
    const bLvl = base_level ? parseInt(base_level, 10) : 1;
    const stg = stage || 'Rookie';
    const expReward = exp_reward ? parseInt(exp_reward, 10) : Math.round((bAtk + bDef) / 2);
    const bitsReward = bits_reward ? parseInt(bits_reward, 10) : Math.round(expReward * 0.5);
    const diffText = (String(difficulty) === '1' || String(difficulty).toLowerCase() === 'boss') ? 'Boss' : 'Normal';

    const sql = `INSERT INTO ${enemyTable} (name, type, hp, attack, defense, attack_speed, base_level, stage, exp_reward, difficulty, sprite_path, bits_reward)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [
      name, type, bHp, bAtk, bDef, bSpd, bLvl, stg, expReward, diffText, sprite_path, bitsReward
    ]);

    // Handle drops
    if (req.body.drops) {
        let drops = req.body.drops;
        if (typeof drops === 'string') {
            try {
                drops = JSON.parse(drops);
            } catch (e) {
                console.error('Error parsing drops JSON', e);
                drops = [];
            }
        }
        
        if (Array.isArray(drops) && drops.length > 0) {
            for (const drop of drops) {
                if (drop.item_id && drop.drop_rate) {
                    try {
                        await db.execute(
                            'INSERT INTO enemy_drops (enemy_id, item_id, drop_rate) VALUES (?, ?, ?)',
                            [result.insertId, drop.item_id, drop.drop_rate]
                        );
                    } catch (dropError) {
                        console.error(`Failed to add drop for new enemy ${result.insertId}:`, dropError.message);
                    }
                }
            }
        }
    }

    res.status(201).json({ message: 'Enemy created', id: result.insertId });
  } catch (error) {
    console.error('CreateEnemy Error:', error);
    res.status(500).json({
      message: 'Error creating enemy',
      error: error.sqlMessage || error.message || String(error),
      code: error.code || null
    });
  }
};

exports.updateEnemy = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, type, difficulty, base_hp, base_attack, base_defense, base_level, stage, exp_reward, bits_reward, attack_speed
    } = req.body;

    const bHp = base_hp ? parseInt(base_hp, 10) : null;
    const bAtk = base_attack ? parseInt(base_attack, 10) : null;
    const bDef = base_defense ? parseInt(base_defense, 10) : null;
    const bSpd = attack_speed ? parseFloat(attack_speed) : null;
    const bLvl = base_level ? parseInt(base_level, 10) : null;
    const stg = stage || null;
    const expReward = exp_reward ? parseInt(exp_reward, 10) : null;
    const bitsReward = bits_reward ? parseInt(bits_reward, 10) : null;
    const diffText = (difficulty !== undefined)
      ? ((String(difficulty) === '1' || String(difficulty).toLowerCase() === 'boss') ? 'Boss' : 'Normal')
      : undefined;

    const [rows] = await db.execute(`SELECT attack, defense FROM ${enemyTable} WHERE id=?`, [id]);
    const current = rows && rows[0] ? rows[0] : { attack: null, defense: null };

    const sets = [];
    const params = [];
    if (name !== undefined) { sets.push('name=?'); params.push(name); }
    if (type !== undefined) { sets.push('type=?'); params.push(type); }
    if (diffText !== undefined) { sets.push('difficulty=?'); params.push(diffText); }
    if (bHp !== null) { sets.push('hp=?'); params.push(bHp); }
    if (bAtk !== null) { sets.push('attack=?'); params.push(bAtk); }
    if (bDef !== null) { sets.push('defense=?'); params.push(bDef); }
    if (bSpd !== null) { sets.push('attack_speed=?'); params.push(bSpd); }
    if (bLvl !== null) { sets.push('base_level=?'); params.push(bLvl); }
    if (stg !== null) { sets.push('stage=?'); params.push(stg); }

    const effectiveAtk = bAtk !== null ? bAtk : current.attack;
    const effectiveDef = bDef !== null ? bDef : current.defense;

    if (expReward !== null) {
      sets.push('exp_reward=?'); params.push(expReward);
      if (bitsReward === null) {
        const computedBits = Math.round(expReward * 0.5);
        sets.push('bits_reward=?'); params.push(computedBits);
      }
    } else {
      if (bAtk !== null || bDef !== null) {
        const computedExp = Math.round((Number(effectiveAtk || 0) + Number(effectiveDef || 0)) / 2);
        sets.push('exp_reward=?'); params.push(computedExp);
        const computedBits = bitsReward !== null ? bitsReward : Math.round(computedExp * 0.5);
        sets.push('bits_reward=?'); params.push(computedBits);
      } else if (bitsReward !== null) {
        sets.push('bits_reward=?'); params.push(bitsReward);
      }
    }

    if (req.file) {
      sets.push('sprite_path=?');
      params.push(`assets/sprites/enemies/${req.file.filename}`);
    }

    if (sets.length === 0 && !req.body.drops) {
      return res.status(400).json({ message: 'Nenhuma alteração fornecida' });
    }

    if (sets.length > 0) {
      const query = `UPDATE ${enemyTable} SET ${sets.join(', ')} WHERE id=?`;
      params.push(id);
      await db.execute(query, params);
    }

    // Handle drops
    if (req.body.drops) {
        let drops = req.body.drops;
        if (typeof drops === 'string') {
             try { drops = JSON.parse(drops); } catch(e) { console.error(e); drops = []; }
        }
        
        if (Array.isArray(drops)) {
            // Delete existing
            try {
                await db.execute('DELETE FROM enemy_drops WHERE enemy_id = ?', [id]);
            } catch (delError) {
                console.error(`Failed to delete existing drops for enemy ${id}:`, delError.message);
                // If delete fails due to FK (unlikely for delete from drops, but possible), we might abort or continue
            }

            // Insert new
            for (const drop of drops) {
                 if (drop.item_id && drop.drop_rate) {
                    try {
                        await db.execute(
                            'INSERT INTO enemy_drops (enemy_id, item_id, drop_rate) VALUES (?, ?, ?)',
                            [id, drop.item_id, drop.drop_rate]
                        );
                    } catch (dropError) {
                         // Ignore foreign key error for drops
                         console.error(`Failed to add drop for enemy ${id} item ${drop.item_id}:`, dropError.message);
                    }
                }
            }
        }
    }

    res.json({ message: 'Enemy updated' });
  } catch (error) {
    console.error('UpdateEnemy Error:', {
      code: error.code,
      message: error.message,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      sql: error.sql
    });
    res.status(500).json({
      message: 'Error updating enemy',
      error: error.sqlMessage || error.message || String(error),
      code: error.code || null
    });
  }
};

exports.deleteEnemy = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM map_enemies WHERE enemy_id = ?', [id]);
    await db.execute('DELETE FROM battles WHERE enemy_id = ?', [id]);
    await db.execute('DELETE FROM enemy_drops WHERE enemy_id = ?', [id]);
    const [result] = await db.execute(`DELETE FROM ${enemyTable} WHERE id = ?`, [id]);
    
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Inimigo não encontrado.' });
    }
    
    res.json({ message: 'Inimigo excluído com sucesso.' });
  } catch (error) {
    console.error('DeleteEnemy Error:', error);
    // Handle Foreign Key Constraint specifically if DB throws it
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
         return res.status(400).json({ message: 'Não é possível excluir: Este inimigo está sendo usado em batalhas ou mapas.' });
    }
    res.status(500).json({ message: 'Erro ao excluir inimigo', error: error.message });
  }
};

exports.getEnemyDrops = async (req, res) => {
  try {
    const { id } = req.params;
    const [drops] = await db.execute(`
      SELECT ed.*, i.name as item_name, i.icon as item_icon 
      FROM enemy_drops ed 
      JOIN items i ON ed.item_id = i.id 
      WHERE ed.enemy_id = ?
    `, [id]);
    res.json(drops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching enemy drops' });
  }
};
