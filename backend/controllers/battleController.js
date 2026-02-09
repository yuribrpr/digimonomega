const db = require('../config/db');

async function getColumns(table) {
  const [rows] = await db.execute(`DESCRIBE ${table}`);
  return rows || [];
}

async function listTables() {
  const dbName = process.env.DB_NAME;
  const [rows] = await db.execute(dbName ? `SHOW TABLES FROM ${dbName}` : 'SHOW TABLES');
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const key = keys.find(k => k.toLowerCase().includes('tables_in'));
  return rows.map(r => r[key]);
}

function has(colList, name) {
  return !!colList.find(c => c.Field === name);
}

function pick(colList, candidates) {
  for (const c of candidates) {
    if (has(colList, c)) return c;
  }
  return null;
}

function resolveStageLevel(row, colList) {
  if (!row) return null;
  // Prefer textual stage if present
  if (has(colList, 'stage')) {
    const s = row.stage;
    if (typeof s === 'string') {
      const key = s.trim().toLowerCase();
      if (key === 'rookie') return 1;
      if (key === 'champion') return 2;
      if (key === 'ultimate') return 3;
      if (key === 'mega') return 4;
      if (key === 'burst mode' || key === 'burst_mode' || key === 'burst') return 5;
    }
  }
  // Numeric stage fields, limited to 1-5
  if (has(colList, 'base_level')) {
    const v = Number(row.base_level);
    if (Number.isFinite(v) && v >= 1 && v <= 5) return v;
  }
  if (has(colList, 'evolution_level')) {
    const v = Number(row.evolution_level);
    if (Number.isFinite(v) && v >= 1 && v <= 5) return v;
  }
  if (has(colList, 'level')) {
    const v = Number(row.level);
    if (Number.isFinite(v) && v >= 1 && v <= 5) return v;
  }
  // Fallback: bucketize base_level ranges into 1..5 (campaign tiers)
  if (has(colList, 'base_level')) {
    const v = Number(row.base_level);
    if (Number.isFinite(v)) {
      if (v <= 15) return 1;
      if (v <= 30) return 2;
      if (v <= 45) return 3;
      if (v <= 60) return 4;
      return 5;
    }
  }
  // Heuristic: if next evolution is missing/null, treat as high stage
  if (has(colList, 'next_evolution_id')) {
    const v = row.next_evolution_id;
    if (v === null || v === undefined || Number(v) === 0) return 4;
  }
  return null;
}

function sumProps(row, keys) {
  if (!row) return 0;
  let s = 0;
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null) s += Number(v) || 0;
  }
  return s;
}

function getAttackBonus(row) {
  return sumProps(row, [
    'extra_attack',
    'attack_bonus',
    'bonus_attack',
    'extra_atk',
    'atk_bonus',
    'atk_extra',
    'attack_extra'
  ]);
}

function inferMaxFromType(typeStr) {
  const t = String(typeStr || '').toLowerCase();
  const unsigned = t.includes('unsigned');
  if (t.includes('tinyint')) return unsigned ? 255 : 127;
  if (t.includes('smallint')) return unsigned ? 65535 : 32767;
  if (t.includes('mediumint')) return unsigned ? 16777215 : 8388607;
  if (t.includes('bigint')) return unsigned ? 9223372036854775807n : 9223372036854775807n; // use bigint cap
  if (t.includes('int')) return unsigned ? 4294967295 : 2147483647;
  if (t.includes('decimal') || t.includes('numeric')) return 1e12;
  return 1e9;
}

async function findPrincipalMappingTable() {
  const tables = await listTables();
  const candidates = tables.filter(t => /user|usuario/i.test(t) && /digimon/i.test(t));
  for (const t of candidates) {
    const cols = await getColumns(t);
    const userIdCol = pick(cols, ['user_id', 'usuario_id', 'id_usuario', 'users_id', 'id_user', 'userId', 'usuarioId', 'idUser']);
    const digiIdCol = pick(cols, [
      'digidex_id', 'id_digidex',
      'digimon_id', 'id_digimon',
      'species_id',
      'digimonId', 'idDigimon',
      'id_digi', 'digi_id'
    ]);
    const principalCol = pick(cols, ['principal', 'is_main', 'main', 'is_principal', 'principal_flag', 'primary', 'isPrimary']);
    if (userIdCol && digiIdCol && principalCol) {
      return { table: t, userIdCol, digiIdCol, principalCol };
    }
  }
  return null;
}

async function getPrincipalDigimonId(userId) {
  const mapping = await findPrincipalMappingTable();
  if (!mapping) return null;
  const { table, userIdCol, digiIdCol, principalCol } = mapping;
  const sql = `SELECT ${digiIdCol} AS digimon_id FROM ${table} WHERE ${userIdCol}=? AND ${principalCol}=1 LIMIT 1`;
  const [rows] = await db.execute(sql, [userId]);
  return rows && rows[0] ? rows[0].digimon_id : null;
}

async function getAnyDigimonIdForUser(userId) {
  const mapping = await findPrincipalMappingTable();
  if (!mapping) return null;
  const { table, userIdCol, digiIdCol } = mapping;
  const sql = `SELECT ${digiIdCol} AS digimon_id FROM ${table} WHERE ${userIdCol}=? LIMIT 1`;
  const [rows] = await db.execute(sql, [userId]);
  return rows && rows[0] ? rows[0].digimon_id : null;
}

async function ensureBattleColumns() {
    try {
        const [rows] = await db.execute('DESCRIBE battles');
        const fields = rows.map(r => r.Field);
        
        if (!fields.includes('enemy_multiplier')) {
            await db.execute('ALTER TABLE battles ADD COLUMN enemy_multiplier FLOAT DEFAULT 1.0');
        }
        if (!fields.includes('user_digimon_id')) {
            await db.execute('ALTER TABLE battles ADD COLUMN user_digimon_id INT DEFAULT NULL');
        }
        if (!fields.includes('enemy_current_hp')) {
            await db.execute('ALTER TABLE battles ADD COLUMN enemy_current_hp INT DEFAULT NULL');
        }
        if (!fields.includes('enemy_max_hp')) {
            await db.execute('ALTER TABLE battles ADD COLUMN enemy_max_hp INT DEFAULT NULL');
        }
        if (!fields.includes('user_current_hp')) {
             await db.execute('ALTER TABLE battles ADD COLUMN user_current_hp INT DEFAULT NULL');
        }
        if (!fields.includes('user_max_hp')) {
             await db.execute('ALTER TABLE battles ADD COLUMN user_max_hp INT DEFAULT NULL');
        }
    } catch (error) {
        console.error('Error ensuring battle columns:', error);
    }
}

exports.getSchema = async (req, res) => {
  try {
    const [describeRows] = await db.execute('DESCRIBE battles');
    const [createRows] = await db.execute('SHOW CREATE TABLE battles');
    const create = createRows && createRows[0] && (createRows[0]['Create Table'] || createRows[0].CreateTable || '');
    res.json({ describe: describeRows, create });
  } catch (error) {
    res.status(500).json({ message: 'Error getting battles schema', error: error.sqlMessage || error.message || String(error) });
  }
};

exports.startBattle = async (req, res) => {
  try {
    const { user_id, map_id } = req.body;
    if (!user_id) return res.status(400).json({ message: 'user_id é obrigatório' });
    const mapping = await findPrincipalMappingTable();
    if (!mapping) return res.status(500).json({ message: 'Tabela users_digimons não encontrada' });
    const { table, userIdCol, digiIdCol, principalCol } = mapping;
    const [mainRows] = await db.execute(`SELECT id, ${digiIdCol} as digimon_id FROM ${table} WHERE ${userIdCol}=? AND ${principalCol}=1 LIMIT 1`, [user_id]);
    let userDigimonRow = mainRows && mainRows[0];
    if (!userDigimonRow) {
      const [anyRows] = await db.execute(`SELECT id, ${digiIdCol} as digimon_id FROM ${table} WHERE ${userIdCol}=? LIMIT 1`, [user_id]);
      userDigimonRow = anyRows && anyRows[0];
    }
    if (!userDigimonRow) return res.status(400).json({ message: 'Usuário não possui digimon' });
    const digidexCols = await getColumns('digidex');
    const digimonSelectCols = ['id', 'name', 'type', 'base_hp', 'base_attack', 'base_defense', 'base_attack_speed', 'sprite_path'];
    if (has(digidexCols, 'base_level')) digimonSelectCols.push('base_level');
    if (has(digidexCols, 'next_evolution_id')) digimonSelectCols.push('next_evolution_id');
    if (has(digidexCols, 'stage')) digimonSelectCols.push('stage');
    if (has(digidexCols, 'evolution_level')) digimonSelectCols.push('evolution_level');
    if (has(digidexCols, 'level')) digimonSelectCols.push('level');
    const [digRows] = await db.execute(`SELECT ${digimonSelectCols.join(', ')} FROM digidex WHERE id=?`, [userDigimonRow.digimon_id]);
    const userDigimon = digRows && digRows[0];
    if (!userDigimon) return res.status(404).json({ message: 'Digimon não encontrado' });
    
    // Map item requirement validation & consumption
    let mapDifficulty = 1.0;
    
    if (map_id) {
      // Ensure columns exist; if not, skip silently
      try {
        const [mapCols] = await db.execute('DESCRIBE maps');
        const colNames = mapCols.map(c => c.Field);
        const hasReq = colNames.includes('require_item') && colNames.includes('required_item_id') && colNames.includes('consume_on_enter');
        
        // Fetch map details including is_active and difficulty if available
        let query = 'SELECT require_item, required_item_id, consume_on_enter';
        if (colNames.includes('is_active')) query += ', is_active';
        if (colNames.includes('difficulty')) query += ', difficulty';
        query += ' FROM maps WHERE id = ? LIMIT 1';

        const [mapRows] = await db.execute(query, [map_id]);
        const mapRow = mapRows && mapRows[0];

        if (mapRow && mapRow.difficulty) {
            mapDifficulty = parseFloat(mapRow.difficulty) || 1.0;
        }

        // Check if map is active
        if (mapRow && colNames.includes('is_active')) {
            const isActive = mapRow.is_active === 1 || mapRow.is_active === true;
            if (!isActive) {
                return res.status(403).json({ message: 'Este mapa está desativado no momento.' });
            }
        }

        if (hasReq && mapRow) {
          if (Number(mapRow.require_item) === 1 && Number(mapRow.required_item_id)) {
            const requiredItemId = Number(mapRow.required_item_id);
            const [invRows] = await db.execute('SELECT id, quantity FROM inventory WHERE user_id = ? AND item_id = ? LIMIT 1', [user_id, requiredItemId]);
            const inv = invRows && invRows[0];
            if (!inv || Number(inv.quantity) < 1) {
              return res.status(400).json({ message: 'Item necessário para acessar o mapa não encontrado no inventário.' });
            }
            if (Number(mapRow.consume_on_enter) === 1) {
              if (Number(inv.quantity) > 1) {
                await db.execute('UPDATE inventory SET quantity = quantity - 1 WHERE id = ?', [inv.id]);
              } else {
                await db.execute('DELETE FROM inventory WHERE id = ?', [inv.id]);
              }
            }
          }
        }
      } catch (e) {
        // If DESCRIBE fails or columns missing, do nothing
      }
    }
    
    // Enemy selection logic
    const enemyCols = await getColumns('enemydex');
    const enemyStageCol = pick(enemyCols, ['stage', 'base_level', 'evolution_level', 'level']);
    const enemySelectCols = ['id', 'name', 'type', 'base_hp', 'base_attack', 'base_defense', 'attack_speed', 'difficulty', 'sprite_path'];
    if (enemyStageCol && !enemySelectCols.includes(enemyStageCol)) {
      enemySelectCols.push(enemyStageCol);
    }
    let enemyQuery = `SELECT ${enemySelectCols.join(', ')} FROM enemydex`;
    let enemyParams = [];

    if (map_id) {
         // Verify if map has enemies
         const [mapEnemies] = await db.execute('SELECT enemy_id FROM map_enemies WHERE map_id = ?', [map_id]);
         if (mapEnemies.length > 0) {
             enemyQuery += ' JOIN map_enemies me ON enemydex.id = me.enemy_id WHERE me.map_id = ? ORDER BY RAND() LIMIT 1';
             enemyParams.push(map_id);
         } else {
             return res.status(404).json({ message: 'Este mapa não possui inimigos configurados.' });
         }
    } else {
        enemyQuery += ' ORDER BY RAND() LIMIT 1';
    }

    const [enemyRows] = await db.execute(enemyQuery, enemyParams);
    const enemy = enemyRows && enemyRows[0];
    if (!enemy) return res.status(404).json({ message: 'Nenhum inimigo disponível' });
    
    // Apply difficulty multiplier
    const enemyHp = Math.floor((Number(enemy.base_hp) || 0) * mapDifficulty);
    const enemyAtk = Math.floor((Number(enemy.base_attack) || 0) * mapDifficulty);
    const enemyDef = Math.floor((Number(enemy.base_defense) || 0) * mapDifficulty);
    const enemySpd = Number(enemy.attack_speed) || 2.0;

    let effHp = Number(userDigimon.base_hp || 0);
    let effAtk = Number(userDigimon.base_attack || 0);
    let effDef = Number(userDigimon.base_defense || 0);
    let effSpd = Number(userDigimon.base_attack_speed || 2.0);
    let effXp = 0;
    let level = Number(userDigimon.base_level || 1);
    let userDisplayName = userDigimon.name;
    let bonusHp = 0;
    let bonusAtk = 0;
    let bonusDef = 0;

    const [mapRows] = await db.execute(`SELECT * FROM ${table} WHERE id=? LIMIT 1`, [userDigimonRow.id]);
    const m = mapRows && mapRows[0];
    
    console.log('User Digimon Base (Digidex):', userDigimon);
    console.log('User Digimon Stats (User Table):', m);

    if (m) {
      // Somar atributos da Digidex + Atributos do Usuário (UserDigimons)
      // Usando extra_hp, extra_attack, extra_defense como bonus
      bonusHp = Number(m.extra_hp ?? 0);
      bonusAtk = getAttackBonus(m);
      bonusDef = Number(m.extra_defense ?? 0);
      
      const userCols = await getColumns(table);
      const hpCol = pick(userCols, ['max_hp', 'hp', 'vida']);
      const atkCol = pick(userCols, ['attack', 'atk', 'ataque', 'forca']);
      const defCol = pick(userCols, ['defense', 'def', 'defesa']);
      const spdCol = pick(userCols, ['attack_speed', 'speed', 'velocidade']);
      const nicknameCol = pick(userCols, ['nickname', 'apelido', 'digimon_name', 'custom_name']);

      effHp = (hpCol ? Number(m[hpCol] || Number(userDigimon.base_hp || 0)) : Number(userDigimon.base_hp || 0)) + bonusHp;
      effAtk = (atkCol ? Number(m[atkCol] || 0) : Number(userDigimon.base_attack || 0)) + bonusAtk;
      console.log('StartBattle ATK calc:', { atkCol, base: Number(userDigimon.base_attack || 0), stored: atkCol ? Number(m[atkCol] || 0) : null, bonus: bonusAtk, final: effAtk });
      effDef = (defCol ? Number(m[defCol] || 0) : Number(userDigimon.base_defense || 0)) + bonusDef;
      
      // FIX: Always use base_attack_speed from Digidex to ensure admin updates reflect immediately.
      // If there are bonuses (e.g. equipment), they should be added here separately if tracked.
      // For now, ignoring the stale 'attack_speed' column in users_digimons if it exists, unless it's strictly a bonus column.
      // Assuming users_digimons.attack_speed was a snapshot. We prefer the live Digidex value.
      effSpd = Number(userDigimon.base_attack_speed || 2.0);
      
      effXp = Number(m.xp ?? m.experience ?? m.exp ?? 0);
      level = Number(m.base_level ?? m.level ?? level);

      if (nicknameCol) {
        const candidate = String(m[nicknameCol] ?? '').trim();
        if (candidate) userDisplayName = candidate;
      }
    }
    
    // Validar e persistir HP atual
    let currentHp = m && m.current_hp !== null ? Number(m.current_hp) : effHp;
    if (currentHp <= 0) currentHp = effHp; // Revive se estiver morto ao iniciar (ou tratar como erro?)
    if (currentHp > effHp) currentHp = effHp; // Cap no max

    // Calcular XP necessário para o próximo nível (Fórmula simples: level * 100)
    const nextLevelXp = level * 100;

    await ensureBattleColumns();

    const insertCols = ['user_id', 'user_digimon_id', 'enemy_id', 'enemy_current_hp', 'enemy_max_hp', 'user_current_hp', 'user_max_hp', 'status', 'enemy_multiplier'];
    const params = [
      user_id, 
      userDigimonRow.id, 
      enemy.id, 
      enemyHp, 
      enemyHp, 
      currentHp, // user_current_hp recuperado do user_digimons
      effHp, // user_max_hp calculado
      'active',
      mapDifficulty
    ];
    const sql = `INSERT INTO battles (${insertCols.join(', ')}) VALUES (${insertCols.map(() => '?').join(', ')})`;
    const [result] = await db.execute(sql, params);
    res.status(201).json({
      id: result.insertId,
      user: {
        id: userDigimon.id,
        name: userDisplayName,
        type: userDigimon.type || null,
        hp: currentHp,
        max_hp: effHp,
        attack: effAtk,
        extra_attack: bonusAtk,
        defense: effDef,
        extra_defense: bonusDef,
        attack_speed: effSpd,
        extra_hp: bonusHp,
        xp: effXp,
        max_xp: nextLevelXp,
        level: level,
        stage_level: resolveStageLevel(userDigimon, digidexCols),
        sprite_path: userDigimon.sprite_path || null
      },
      enemy: {
        id: enemy.id,
        name: enemy.name,
        type: enemy.type || null,
        hp: enemyHp,
        max_hp: enemyHp,
        attack: enemyAtk,
        defense: enemyDef,
        attack_speed: enemySpd,
        difficulty: enemy.difficulty || 'Normal',
        stage_level: resolveStageLevel(enemy, enemyCols),
        sprite_path: enemy.sprite_path || null
      },
      log: []
    });
  } catch (error) {
    console.error('StartBattle Error:', {
      code: error.code,
      message: error.message,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      sql: error.sql
    });
    res.status(500).json({ message: 'Erro ao iniciar batalha', error: error.sqlMessage || error.message || String(error), code: error.code || null });
  }
};

exports.attack = async (req, res) => {
  try {
    const { id } = req.params;
    const { actor } = req.query; // 'player' or 'enemy' (defaults to undefined = full turn)

    // Agora buscamos user_current_hp e user_max_hp da tabela battles
    const [battleRows] = await db.execute(`SELECT user_id, user_digimon_id, enemy_id, enemy_current_hp, enemy_max_hp, user_current_hp, user_max_hp, enemy_multiplier FROM battles WHERE id=?`, [id]);
    const battle = battleRows && battleRows[0];
    if (!battle) return res.status(404).json({ message: 'Batalha não encontrada' });
    
    const enemyMultiplier = battle.enemy_multiplier || 1.0;

    const mapping = await findPrincipalMappingTable();
    if (!mapping) return res.status(500).json({ message: 'Tabela users_digimons não encontrada' });
    const { table, digiIdCol } = mapping;
    // Fetch full user digimon details including extra stats
    const [mapRows] = await db.execute(`SELECT * FROM ${table} WHERE id=? LIMIT 1`, [battle.user_digimon_id]);
    const map = mapRows && mapRows[0];
    if (!map) return res.status(404).json({ message: 'Digimon do usuário não encontrado' });
    // Use the correct column for digimon_id based on mapping
    const digimonId = map[digiIdCol];
    const digidexCols = await getColumns('digidex');
    const digimonSelectCols = ['id', 'name', 'type', 'base_hp', 'base_attack', 'base_defense', 'base_attack_speed', 'sprite_path'];
    if (has(digidexCols, 'base_level')) digimonSelectCols.push('base_level');
    if (has(digidexCols, 'next_evolution_id')) digimonSelectCols.push('next_evolution_id');
    if (has(digidexCols, 'stage')) digimonSelectCols.push('stage');
    if (has(digidexCols, 'evolution_level')) digimonSelectCols.push('evolution_level');
    if (has(digidexCols, 'level')) digimonSelectCols.push('level');
    const [digRows] = await db.execute(`SELECT ${digimonSelectCols.join(', ')} FROM digidex WHERE id=?`, [digimonId]);
    const userDigimon = digRows && digRows[0];
    const enemyCols = await getColumns('enemydex');
    const enemyStageCol = pick(enemyCols, ['stage', 'base_level', 'evolution_level', 'level']);
    const enemySelectCols = ['id', 'name', 'type', 'base_hp', 'base_attack', 'base_defense', 'attack_speed', 'difficulty', 'sprite_path', 'exp_reward', 'bits_reward'];
    if (enemyStageCol && !enemySelectCols.includes(enemyStageCol)) {
      enemySelectCols.push(enemyStageCol);
    }
    const [enemyRows] = await db.execute(`SELECT ${enemySelectCols.join(', ')} FROM enemydex WHERE id=?`, [battle.enemy_id]);
    const enemy = enemyRows && enemyRows[0];

    // Calculate effective stats (prefer stored columns; fallback base + extras)
    const userCols = await getColumns(table);
    const atkCol = pick(userCols, ['attack', 'atk', 'ataque', 'forca']);
    const defCol = pick(userCols, ['defense', 'def', 'defesa']);
    const bonusHp = Number(map.extra_hp ?? 0);
    const bonusAtk = getAttackBonus(map);
    const bonusDef = Number(map.extra_defense ?? 0);
    
    let userAtk = (atkCol ? Number(map[atkCol] || 0) : Number(userDigimon?.base_attack || 0)) + bonusAtk;
    let userDef = (defCol ? Number(map[defCol] || 0) : Number(userDigimon?.base_defense || 0)) + bonusDef;
    
    const enemyAtk = Math.floor(Number(enemy?.base_attack || 0) * enemyMultiplier);
    const enemyDef = Math.floor(Number(enemy?.base_defense || 0) * enemyMultiplier);

    let userDamage = 0;
    let enemyDamage = 0;
    let isCrit = false;
    let extraLogs = [];
    let win = false;
    let rewards = null;

    let newEnemyHp = Number(battle.enemy_current_hp ?? enemy.base_hp ?? 0);
    // Usar user_current_hp do banco se existir, senão calcular do máximo
    const currentHp = battle.user_current_hp !== null ? Number(battle.user_current_hp) : Number(battle.user_max_hp || userDigimon.base_hp);
    let newUserHp = currentHp;

    // --- LOGIC SPLIT BY ACTOR ---

    // 1. Player Action (Default or Explicit)
    if (!actor || actor === 'player') {
        const rawUserDamage = userAtk - enemyDef / 2;
        let userFactor = Math.random() < 0.8 ? (1.02 + Math.random() * 0.13) : (0.90 + Math.random() * 0.09);
        isCrit = Math.random() < 0.35;
        if (isCrit) userFactor = 1.15;
        userDamage = Math.max(1, Math.round(rawUserDamage * userFactor));

        newEnemyHp = Math.max(0, newEnemyHp - userDamage);
        extraLogs.push(`Você causou ${userDamage} de dano`);
        if (isCrit) extraLogs.push('Golpe Crítico!');

        if (newEnemyHp <= 0) {
            win = true;
        }
    }

    // 2. Enemy Action (Default or Explicit) - Only if Player didn't win yet (or if simultaneous)
    // Note: If actor is missing (legacy), we do both. If actor='enemy', we only do enemy.
    if ((!actor || actor === 'enemy') && !win) {
        const rawEnemyDamage = enemyAtk - userDef / 2;
        let enemyFactor = Math.random() < 0.8 ? (1.01 + Math.random() * 0.10) : (0.90 + Math.random() * 0.09);
        enemyDamage = Math.max(1, Math.round(rawEnemyDamage * enemyFactor));

        newUserHp = Math.max(0, currentHp - enemyDamage);
        extraLogs.push(`Você tomou ${enemyDamage} de dano`);
    }

    // Atualizar HP do inimigo e do usuário na tabela battles
    await db.execute(`UPDATE battles SET enemy_current_hp=?, user_current_hp=? WHERE id=?`, [newEnemyHp, newUserHp, id]);

    // Persistir HP atual na tabela de digimons do usuário para manter sessão entre batalhas
    if (table) {
       // Atualiza current_hp e max_hp (para garantir que o max esteja sincronizado com o calculado na batalha)
       const maxHpRaw = battle.user_max_hp !== null ? Number(battle.user_max_hp) : Number(userDigimon.base_hp);
       const userCols = await getColumns(table);
       const hpColDef = userCols.find(c => ['max_hp','hp','vida'].includes(c.Field));
       const typeMax = inferMaxFromType(hpColDef?.Type);
       const maxHpToSave = Math.min(maxHpRaw, Number(typeMax));
       const newUserHpCapped = Math.min(newUserHp, maxHpToSave);
       await db.execute(`UPDATE ${table} SET current_hp=?, max_hp=? WHERE id=?`, [newUserHpCapped, maxHpToSave, battle.user_digimon_id]);
    }

    let userStageLevel = resolveStageLevel(userDigimon, digidexCols);
    let enemyStageLevel = resolveStageLevel(enemy, enemyCols);

    if (win) {
      // Fetch global multipliers
      const [settings] = await db.execute('SELECT setting_key, setting_value FROM game_settings');
      let xpMult = 1;
      let bitsMult = 1;
      
      settings.forEach(s => {
          if (s.setting_key === 'global_xp_multiplier') xpMult = parseFloat(String(s.setting_value).replace(',', '.')) || 1;
          if (s.setting_key === 'global_bits_multiplier') bitsMult = parseFloat(String(s.setting_value).replace(',', '.')) || 1;
      });

      // Calcular recompensas usando dados do banco se disponíveis
      const baseXp = Math.floor((enemy.exp_reward ? Number(enemy.exp_reward) : Math.floor((Number(enemy.base_hp || 10) + Number(enemy.base_attack || 0)) / 2)) * enemyMultiplier);
      const baseBits = Math.floor((enemy.bits_reward ? Number(enemy.bits_reward) : Math.floor(baseXp * 1.5)) * enemyMultiplier);
      
      const xpGain = Math.floor(baseXp * xpMult);
      const bitsGain = Math.floor(baseBits * bitsMult);
      
      // --- DROP LOGIC ---
      const [drops] = await db.execute('SELECT ed.item_id, ed.drop_rate, i.name, i.icon, i.type, i.effect_target, i.effect_value, i.is_percent FROM enemy_drops ed JOIN items i ON ed.item_id = i.id WHERE ed.enemy_id = ?', [enemy.id]);
      
      const droppedItems = [];
      let allowedQuestItemIds = null;
      if (drops && drops.some(d => String(d.type || '').toLowerCase() === 'quest')) {
          try {
              const [reqRows] = await db.execute(
                `
                SELECT DISTINCT qo.target_item_id AS item_id
                FROM user_quests uq
                JOIN quest_objectives qo ON qo.quest_id = uq.quest_id
                WHERE uq.user_id = ?
                  AND uq.status = 'IN_PROGRESS'
                  AND qo.type = 'COLLECT_ITEM'
                  AND qo.target_item_id IS NOT NULL
                `,
                [battle.user_id]
              );
              allowedQuestItemIds = new Set((reqRows || []).map(r => Number(r.item_id)));
          } catch (e) {
              allowedQuestItemIds = null;
          }
      }
      if (drops && drops.length > 0) {
          for (const drop of drops) {
              const chance = Number(drop.drop_rate);
              const roll = Math.random() * 100;
              if (roll <= chance) {
                  const isQuestItem = String(drop.type || '').toLowerCase() === 'quest';
                  if (isQuestItem && allowedQuestItemIds && !allowedQuestItemIds.has(Number(drop.item_id))) {
                      continue;
                  }
                  droppedItems.push(drop);
                  
                  // Add to inventory
                  const [invRows] = await db.execute('SELECT id FROM inventory WHERE user_id = ? AND item_id = ?', [battle.user_id, drop.item_id]);
                  if (invRows.length > 0) {
                      await db.execute('UPDATE inventory SET quantity = quantity + 1 WHERE id = ?', [invRows[0].id]);
                  } else {
                      await db.execute('INSERT INTO inventory (user_id, item_id, quantity) VALUES (?, ?, 1)', [battle.user_id, drop.item_id]);
                  }
                  
                  extraLogs.push(`Você obteve: ${drop.name}!`);
              }
          }
      }

      console.log('Battle Win - Settings:', settings);
      console.log('Battle Win - Multipliers:', xpMult, bitsMult);
      console.log('Battle Win - Rewards:', { baseXp, baseBits, xpGain, bitsGain, droppedItems });

      if (xpMult > 1 || bitsMult > 1) {
        extraLogs.push(`Bônus de Servidor Ativo! (x${xpMult} XP, x${bitsMult} Bits)`);
      }
      
      rewards = { xp: xpGain, bits: bitsGain, drops: droppedItems };

      // Atualizar status da batalha
      await db.execute(`UPDATE battles SET status='won' WHERE id=?`, [id]);

      // --- QUEST UPDATE LOGIC ---
      try {
        const activeQuests = await db.execute('SELECT * FROM user_quests WHERE user_id = ? AND status = ?', [battle.user_id, 'IN_PROGRESS']).then(([rows]) => rows);
        
        if (activeQuests.length > 0) {
            for (const quest of activeQuests) {
                const objectives = await db.execute('SELECT * FROM quest_objectives WHERE quest_id = ?', [quest.quest_id]).then(([rows]) => rows);
                let progress = quest.progress;
                if (typeof progress === 'string') {
                    try {
                        progress = JSON.parse(progress || '{}');
                    } catch {
                        progress = {};
                    }
                } else if (Buffer.isBuffer(progress)) {
                    try {
                        progress = JSON.parse(progress.toString('utf8') || '{}');
                    } catch {
                        progress = {};
                    }
                } else if (!progress || typeof progress !== 'object') {
                    progress = {};
                }
                let updated = false;

                for (const obj of objectives) {
                    if (obj.type === 'KILL_ENEMY' && Number(obj.target_enemy_id) === Number(enemy.id)) {
                        const current = progress[obj.id] || 0;
                        if (current < obj.quantity_required) {
                            progress[obj.id] = current + 1;
                            updated = true;
                        }
                    } else if (obj.type === 'COLLECT_ITEM' && obj.target_item_id) {
                         const [invRows] = await db.execute('SELECT quantity FROM inventory WHERE user_id = ? AND item_id = ?', [battle.user_id, Number(obj.target_item_id)]);
                         const currentQty = invRows.length > 0 ? Number(invRows[0].quantity || 0) : 0;
                         if (Number(progress[obj.id] || 0) !== currentQty) {
                             progress[obj.id] = currentQty;
                             updated = true;
                         }
                    }
                }

                const allCompleted = objectives.every((obj) => Number(progress[obj.id] || 0) >= Number(obj.quantity_required || 0));

                if (updated || (allCompleted && quest.status === 'IN_PROGRESS')) {
                    if (allCompleted && quest.status === 'IN_PROGRESS') {
                        await db.execute('UPDATE user_quests SET progress = ?, status = ?, completed_at = NOW() WHERE id = ?', [
                            JSON.stringify(progress),
                            'COMPLETED',
                            quest.id
                        ]);
                        try {
                            for (const obj of objectives) {
                                if (obj.type === 'COLLECT_ITEM' && obj.target_item_id && Number(obj.quantity_required) > 0) {
                                    await db.execute(
                                        'UPDATE inventory SET quantity = GREATEST(quantity - ?, 0) WHERE user_id = ? AND item_id = ?',
                                        [Number(obj.quantity_required), battle.user_id, Number(obj.target_item_id)]
                                    );
                                }
                            }
                        } catch (consumeErr) {
                            console.error('Erro ao consumir itens da missão ao finalizar:', consumeErr);
                        }
                    } else if (updated) {
                        await db.execute('UPDATE user_quests SET progress = ? WHERE id = ?', [JSON.stringify(progress), quest.id]);
                    }
                }
            }
        }
      } catch (questError) {
          console.error('Error updating quests after battle:', questError);
          // Don't fail the battle response just because quest update failed
      }

      // Atualizar user_digimons com XP
      const mapping = await findPrincipalMappingTable();
      if (mapping) {
        const { table, digiIdCol } = mapping;
        const userCols = await getColumns(table);
        const xpCol = pick(userCols, ['xp', 'experience', 'exp']);
        const levelCol = pick(userCols, ['level', 'base_level', 'lvl']);
        const hpCol = pick(userCols, ['max_hp', 'hp', 'vida']);
        const atkCol = pick(userCols, ['attack', 'atk', 'ataque', 'forca']);
        const defCol = pick(userCols, ['defense', 'def', 'defesa']);

        const sets = [];
        const params = [];
        if (xpCol) {
          sets.push(`${xpCol} = COALESCE(${xpCol}, 0) + ?`);
          params.push(xpGain);
        }

        if (sets.length > 0) {
           await db.execute(`UPDATE ${table} SET ${sets.join(', ')} WHERE id=?`, [...params, battle.user_digimon_id]);
        }

        // Update bits in users table
        await db.execute('UPDATE users SET bits = COALESCE(bits, 0) + ? WHERE id = ?', [bitsGain, battle.user_id]);

        // --- USER LEVEL UP LOGIC ---
        // 15% of Digimon XP to User
        const userXpGain = Math.max(1, Math.floor(xpGain * 0.15));
        
        // Fetch current user stats
        const [uRows] = await db.execute('SELECT exp, exp_m, level FROM users WHERE id = ?', [battle.user_id]);
        if (uRows.length > 0) {
            let u = uRows[0];
            let newExp = (u.exp || 0) + userXpGain;
            let newLevel = u.level || 1;
            let newExpM = u.exp_m || 1000;
            let leveledUp = false;

            while (newExp >= newExpM) {
                newExp -= newExpM;
                newLevel++;
                newExpM = Math.floor(newExpM * 1.2); 
                leveledUp = true;
            }

            await db.execute('UPDATE users SET exp = ?, exp_m = ?, level = ? WHERE id = ?', [newExp, newExpM, newLevel, battle.user_id]);
            
            if (leveledUp) {
                extraLogs.push(`Você subiu para o nível ${newLevel}!`);
            }
        }

        // --- LEVEL UP LOGIC ---
        if (xpCol && levelCol) {
            // Fetch updated data
            const [freshRows] = await db.execute(`SELECT * FROM ${table} WHERE id=? LIMIT 1`, [battle.user_digimon_id]);
            const freshUserDigimon = freshRows && freshRows[0];

            if (freshUserDigimon) {
                let currentXp = Number(freshUserDigimon[xpCol] || 0);
                let currentLevel = Number(freshUserDigimon[levelCol] || 1);
                
                let currentHp = hpCol ? Number(freshUserDigimon[hpCol] || 0) : 0;
                let currentAtk = atkCol ? Number(freshUserDigimon[atkCol] || 0) : 0;
                let currentDef = defCol ? Number(freshUserDigimon[defCol] || 0) : 0;

                let leveledUp = false;

                // Level Up Loop (Threshold: Level * 100)
                let nextLevelXp = currentLevel * 100;
                
                // While XP is enough for next level
                while (currentXp >= nextLevelXp && currentLevel < 100) {
                    currentXp -= nextLevelXp;
                    currentLevel++;
                    leveledUp = true;
                    
                    if (hpCol) currentHp = Math.floor(currentHp * 1.05);
                    if (atkCol) currentAtk = Math.floor(currentAtk * 1.05);
                    if (defCol) currentDef = Math.floor(currentDef * 1.05);

                    nextLevelXp = currentLevel * 100;
                    extraLogs.push(`Level Up! Nível ${currentLevel}! (+5% Status)`);
                }

                if (currentLevel >= 100) {
                    currentXp = 0;
                }

                if (leveledUp) {
                    const updates = [];
                    const updateParams = [];
                    
                    updates.push(`${xpCol} = ?`);
                    updateParams.push(currentXp);
                    
                    updates.push(`${levelCol} = ?`);
                    updateParams.push(currentLevel);
                    
                    if (hpCol) { updates.push(`${hpCol} = ?`); updateParams.push(currentHp); }
                    if (atkCol) { updates.push(`${atkCol} = ?`); updateParams.push(currentAtk); }
                    if (defCol) { updates.push(`${defCol} = ?`); updateParams.push(currentDef); }
                    
                    await db.execute(`UPDATE ${table} SET ${updates.join(', ')} WHERE id=?`, [...updateParams, battle.user_digimon_id]);
                }
            }
        }
      }
    }

    // Recalcular status para retorno (usando dados atualizados do user_digimon)
    let effHp = Number(battle.user_max_hp || 0);
    let effXp = 0;
    let level = Number(userDigimon.base_level || 1);
    let userName = userDigimon?.name;
    let userSprite = userDigimon?.sprite_path || null;

    const [fullMapRows] = await db.execute(`SELECT * FROM ${table} WHERE id=? LIMIT 1`, [battle.user_digimon_id]);
    const fullMap = fullMapRows && fullMapRows[0];
    
    // Default Speed Logic: Base Speed from Digidex - Reduction from User Instance (default 0)
    // Currently, we don't have a 'reduction' column, so we assume 0.
    // We prioritize Digidex Base Speed over any stored speed in user instance to ensure Admin updates reflect immediately.
    let effSpd = Number(userDigimon?.base_attack_speed || 2.0); 
    console.log('Battle Attack Debug:', { 
        digimonId, 
        base_speed: userDigimon?.base_attack_speed, 
        effSpd 
    });

    if (fullMap) {
       // Recarregar colunas dinâmicas e usar valores atualizados
       const userCols2 = await getColumns(table);
       const xpCol2 = pick(userCols2, ['xp', 'experience', 'exp']);
       const levelCol2 = pick(userCols2, ['level', 'base_level', 'lvl']);
       const hpCol2 = pick(userCols2, ['max_hp', 'hp', 'vida']);
       const atkCol2 = pick(userCols2, ['attack', 'atk', 'ataque', 'forca']);
       const defCol2 = pick(userCols2, ['defense', 'def', 'defesa']);

       if (xpCol2) effXp = Number(fullMap[xpCol2] || 0);
       if (levelCol2) level = Number(fullMap[levelCol2] || level);

       // HP efetivo: somar extras à coluna persistida (ou base)
       if (hpCol2) {
         effHp = (Number(fullMap[hpCol2] || effHp || userDigimon.base_hp || 0) + Number(fullMap.extra_hp ?? 0));
       } else {
         effHp = Number(userDigimon.base_hp || 0) + Number(fullMap.extra_hp ?? 0);
       }

      // Ataque/Defesa: preferir colunas atualizadas; fallback base + extras
      if (atkCol2) {
        userAtk = Number(fullMap[atkCol2] || 0) + getAttackBonus(fullMap);
      } else {
        userAtk = Number(userDigimon?.base_attack || 0) + getAttackBonus(fullMap);
      }
       if (defCol2) {
         userDef = Number(fullMap[defCol2] || userDef || 0) + Number(fullMap.extra_defense ?? 0);
       } else {
         userDef = Number(userDigimon?.base_defense || 0) + Number(fullMap.extra_defense ?? 0);
       }

       // Re-verify Speed if mapping exists (just in case user has stored speed that we want to ignore or respect in future)
       // For now, effSpd is already set to userDigimon.base_attack_speed at top of this block.
       // But wait, 'userDigimon' variable at top of block was the INITIAL fetch.
       // If evolution happened (unlikely here but possible in logic), we need to ensure effSpd is correct.
       // Let's re-fetch base_attack_speed if digimonId changed.
       
       // Atualizar nome/sprite se houve evolução (digimon_id mudou)
       const digimonId2 = fullMap && mapping ? fullMap[mapping.digiIdCol] : null;
       if (digimonId2 && digimonId2 !== userDigimon?.id) {
         const digimonSelectCols2 = ['id', 'name', 'sprite_path', 'base_attack_speed'];
         if (has(digidexCols, 'base_level')) digimonSelectCols2.push('base_level');
         if (has(digidexCols, 'next_evolution_id')) digimonSelectCols2.push('next_evolution_id');
         if (has(digidexCols, 'stage')) digimonSelectCols2.push('stage');
        if (has(digidexCols, 'evolution_level')) digimonSelectCols2.push('evolution_level');
        if (has(digidexCols, 'level')) digimonSelectCols2.push('level');
         const [digRows2] = await db.execute(`SELECT ${digimonSelectCols2.join(', ')} FROM digidex WHERE id=?`, [digimonId2]);
         if (digRows2 && digRows2[0]) {
           userName = digRows2[0].name;
           userSprite = digRows2[0].sprite_path || userSprite;
           effSpd = Number(digRows2[0].base_attack_speed || 2.0);
           userStageLevel = resolveStageLevel(digRows2[0], digidexCols) ?? userStageLevel;
         }
       }
    }

    // Force explicit speed check even if no evolution, in case userDigimon (initial fetch) was stale or logic drifted
    // Actually, effSpd is set to userDigimon.base_attack_speed earlier.
    // Let's ensure userDigimon has the right value.
    if (!fullMap || (fullMap && fullMap[mapping.digiIdCol] === userDigimon?.id)) {
        // If same digimon, ensure we are using the freshly fetched userDigimon.base_attack_speed
        // But userDigimon was fetched at start of function.
        // Let's just double check the DB if needed? No, userDigimon fetch is fresh per request.
        // The issue might be that userDigimon fetch query DOES NOT include base_attack_speed in attack() function?
        // Let's check line 363.
        // It says: SELECT id, name, base_hp, base_attack, base_defense, sprite_path FROM digidex...
        // IT IS MISSING base_attack_speed!
    }

    const nextLevelXp = level * 100;

    // Sincronizar max HP calculado com a batalha para próximos turnos
    await db.execute(`UPDATE battles SET user_max_hp=? WHERE id=?`, [effHp, id]);

    res.json({
      id,
      win,
      rewards,
      user: {
        id: userDigimon?.id,
        name: userName,
        type: userDigimon?.type || null,
        hp: newUserHp,
        max_hp: effHp,
        attack: userAtk,
        extra_attack: bonusAtk,
        defense: userDef,
        extra_defense: bonusDef,
        attack_speed: effSpd,
        extra_hp: bonusHp,
        xp: effXp + (win ? (rewards?.xp || 0) : 0),
        max_xp: nextLevelXp,
        level: level,
        stage_level: userStageLevel,
        sprite_path: userSprite
      },
      enemy: {
        id: enemy?.id,
        name: enemy?.name,
        type: enemy?.type || null,
        hp: newEnemyHp,
        max_hp: Number(battle.enemy_max_hp ?? enemy.base_hp ?? 0),
        attack: enemyAtk,
        defense: enemyDef,
        attack_speed: Number(enemy?.attack_speed) || 2.0,
        difficulty: enemy?.difficulty || 'Normal',
        stage_level: enemyStageLevel,
        sprite_path: enemy?.sprite_path || null
      },
      crit: isCrit,
      user_damage: userDamage,
      enemy_damage: enemyDamage,
      log: extraLogs // Use the specific logs collected
    });
  } catch (error) {
    console.error('Attack Error:', {
      code: error.code,
      message: error.message,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      sql: error.sql,
      stack: error.stack
    });
    res.status(500).json({ message: 'Erro ao atacar', error: error.sqlMessage || error.message || String(error), code: error.code || null });
  }
};

exports.heal = async (req, res) => {
  try {
    const { id } = req.params;
    const [battleRows] = await db.execute(`SELECT user_digimon_id, user_max_hp FROM battles WHERE id=?`, [id]);
    const battle = battleRows && battleRows[0];
    if (!battle) return res.status(404).json({ message: 'Batalha não encontrada' });

    const mapping = await findPrincipalMappingTable();
    if (!mapping) return res.status(500).json({ message: 'Tabela users_digimons não encontrada' });
    const { table, digiIdCol } = mapping;

    // Recuperar info completa para retorno
    const [mapRows] = await db.execute(`SELECT * FROM ${table} WHERE id=? LIMIT 1`, [battle.user_digimon_id]);
    const map = mapRows && mapRows[0];
    if (!map) return res.status(404).json({ message: 'Digimon do usuário não encontrado' });
    
    const digimonId = map[digiIdCol];
    const [digRows] = await db.execute('SELECT id, name, base_hp, base_attack, base_defense, sprite_path FROM digidex WHERE id=?', [digimonId]);
    const userDigimon = digRows && digRows[0];

    // Restaurar HP para o máximo
    const maxHp = Number(battle.user_max_hp || userDigimon.base_hp);
    
    // Atualizar tabela battles
    await db.execute(`UPDATE battles SET user_current_hp=? WHERE id=?`, [maxHp, id]);

    // Atualizar tabela user_digimons
    await db.execute(`UPDATE ${table} SET current_hp=? WHERE id=?`, [maxHp, battle.user_digimon_id]);

    res.json({
      message: 'Digimon curado com sucesso!',
      user: {
        hp: maxHp,
        max_hp: maxHp
      },
      log: [`Você usou uma poção de cura completa! HP restaurado.`]
    });

  } catch (error) {
    res.status(500).json({ message: 'Erro ao curar', error: error.sqlMessage || error.message || String(error) });
  }
};

exports.flee = async (req, res) => {
  try {
    const { id } = req.params;
    const { map_id } = req.body; // Receive map_id from request

    let mapDifficulty = 1.0;

    // Get map difficulty first
    if (map_id) {
        try {
            const [mapRows] = await db.execute('SELECT difficulty FROM maps WHERE id = ?', [map_id]);
            if (mapRows && mapRows.length > 0) {
                mapDifficulty = parseFloat(mapRows[0].difficulty) || 1.0;
            }
        } catch (e) {
            console.error('Error fetching map difficulty in flee:', e);
        }
    }

    const enemyCols = await getColumns('enemydex');
    const enemyStageCol = pick(enemyCols, ['stage', 'base_level', 'evolution_level', 'level']);
    const enemySelectCols = ['id', 'name', 'type', 'base_hp', 'base_attack', 'base_defense', 'attack_speed', 'difficulty', 'sprite_path'];
    if (enemyStageCol && !enemySelectCols.includes(enemyStageCol)) {
      enemySelectCols.push(enemyStageCol);
    }
    let enemyQuery = `SELECT ${enemySelectCols.join(', ')} FROM enemydex`;
    let enemyParams = [];

    if (map_id) {
         // Verify if map has enemies
         const [mapEnemies] = await db.execute('SELECT enemy_id FROM map_enemies WHERE map_id = ?', [map_id]);
         if (mapEnemies.length > 0) {
             enemyQuery += ' JOIN map_enemies me ON enemydex.id = me.enemy_id WHERE me.map_id = ? ORDER BY RAND() LIMIT 1';
             enemyParams.push(map_id);
         } else {
             // Fallback to random if map has no enemies (shouldn't happen if properly configured)
             enemyQuery += ' ORDER BY RAND() LIMIT 1';
         }
    } else {
        enemyQuery += ' ORDER BY RAND() LIMIT 1';
    }

    const [enemyRows] = await db.execute(enemyQuery, enemyParams);
    const enemy = enemyRows && enemyRows[0];
    if (!enemy) return res.status(404).json({ message: 'Nenhum inimigo disponível' });

    // Apply difficulty
    const enemyHp = Math.floor((Number(enemy.base_hp) || 0) * mapDifficulty);
    const enemyAtk = Math.floor((Number(enemy.base_attack) || 0) * mapDifficulty);
    const enemyDef = Math.floor((Number(enemy.base_defense) || 0) * mapDifficulty);

    await db.execute(`UPDATE battles SET enemy_id=?, enemy_current_hp=?, enemy_max_hp=?, enemy_multiplier=? WHERE id=?`, [enemy.id, enemyHp, enemyHp, mapDifficulty, id]);

    res.json({
      id,
      enemy: {
        id: enemy.id,
        name: enemy.name,
        type: enemy.type || null,
        hp: enemyHp,
        attack: enemyAtk,
        defense: enemyDef,
        attack_speed: Number(enemy.attack_speed) || 2.0,
        difficulty: enemy.difficulty || 'Normal',
        stage_level: resolveStageLevel(enemy, enemyCols),
        sprite_path: enemy.sprite_path || null
      },
      log: [`Você fugiu. Novo inimigo: ${enemy.name}`]
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fugir', error: error.sqlMessage || error.message || String(error) });
  }
};

exports.setMain = async (req, res) => {
  try {
    const { user_id, digimon_id } = req.body;
    if (!user_id || !digimon_id) return res.status(400).json({ message: 'user_id e digimon_id são obrigatórios' });
    const mapping = await findPrincipalMappingTable();
    if (!mapping) return res.status(500).json({ message: 'Tabela de mapeamento do principal não encontrada' });
    const { table, userIdCol, digiIdCol, principalCol } = mapping;
    await db.execute(`UPDATE ${table} SET ${principalCol}=0 WHERE ${userIdCol}=?`, [user_id]);
    await db.execute(`UPDATE ${table} SET ${principalCol}=1 WHERE ${userIdCol}=? AND ${digiIdCol}=?`, [user_id, digimon_id]);
    res.json({ message: 'Principal atualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao definir principal', error: error.sqlMessage || error.message || String(error) });
  }
};
