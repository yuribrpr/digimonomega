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
    const [digRows] = await db.execute('SELECT id, name, base_hp, base_attack, base_defense, sprite_path FROM digidex WHERE id=?', [userDigimonRow.digimon_id]);
    const userDigimon = digRows && digRows[0];
    if (!userDigimon) return res.status(404).json({ message: 'Digimon não encontrado' });
    
    // Map item requirement validation & consumption
    if (map_id) {
      // Ensure columns exist; if not, skip silently
      try {
        const [mapCols] = await db.execute('DESCRIBE maps');
        const colNames = mapCols.map(c => c.Field);
        const hasReq = colNames.includes('require_item') && colNames.includes('required_item_id') && colNames.includes('consume_on_enter');
        
        // Fetch map details including is_active if available
        let query = 'SELECT require_item, required_item_id, consume_on_enter';
        if (colNames.includes('is_active')) query += ', is_active';
        query += ' FROM maps WHERE id = ? LIMIT 1';

        const [mapRows] = await db.execute(query, [map_id]);
        const mapRow = mapRows && mapRows[0];

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
    let enemyQuery = 'SELECT id, name, hp, attack, defense, difficulty, sprite_path FROM enemydex';
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
    
    let effHp = Number(userDigimon.base_hp || 0);
    let effAtk = Number(userDigimon.base_attack || 0);
    let effDef = Number(userDigimon.base_defense || 0);
    let effXp = 0;
    let level = Number(userDigimon.base_level || 1);

    const [mapRows] = await db.execute(`SELECT * FROM ${table} WHERE id=? LIMIT 1`, [userDigimonRow.id]);
    const m = mapRows && mapRows[0];
    
    console.log('User Digimon Base (Digidex):', userDigimon);
    console.log('User Digimon Stats (User Table):', m);

    if (m) {
      // Somar atributos da Digidex + Atributos do Usuário (UserDigimons)
      // Usando extra_hp, extra_attack, extra_defense como bonus
      const bonusHp = Number(m.extra_hp ?? 0);
      const bonusAtk = getAttackBonus(m);
      const bonusDef = Number(m.extra_defense ?? 0);
      
      const userCols = await getColumns(table);
      const hpCol = pick(userCols, ['max_hp', 'hp', 'vida']);
      const atkCol = pick(userCols, ['attack', 'atk', 'ataque', 'forca']);
      const defCol = pick(userCols, ['defense', 'def', 'defesa']);
      effHp = (hpCol ? Number(m[hpCol] || Number(userDigimon.base_hp || 0)) : Number(userDigimon.base_hp || 0)) + bonusHp;
      effAtk = (atkCol ? Number(m[atkCol] || 0) : Number(userDigimon.base_attack || 0)) + bonusAtk;
      console.log('StartBattle ATK calc:', { atkCol, base: Number(userDigimon.base_attack || 0), stored: atkCol ? Number(m[atkCol] || 0) : null, bonus: bonusAtk, final: effAtk });
      effDef = (defCol ? Number(m[defCol] || 0) : Number(userDigimon.base_defense || 0)) + bonusDef;
      effXp = Number(m.xp ?? m.experience ?? m.exp ?? 0);
      level = Number(m.base_level ?? m.level ?? level);
    }
    
    // Validar e persistir HP atual
    let currentHp = m && m.current_hp !== null ? Number(m.current_hp) : effHp;
    if (currentHp <= 0) currentHp = effHp; // Revive se estiver morto ao iniciar (ou tratar como erro?)
    if (currentHp > effHp) currentHp = effHp; // Cap no max

    // Calcular XP necessário para o próximo nível (Fórmula simples: level * 100)
    const nextLevelXp = level * 100;

    const insertCols = ['user_id', 'user_digimon_id', 'enemy_id', 'enemy_current_hp', 'enemy_max_hp', 'user_current_hp', 'user_max_hp', 'status'];
    const params = [
      user_id, 
      userDigimonRow.id, 
      enemy.id, 
      Number(enemy.hp || 0), 
      Number(enemy.hp || 0), 
      currentHp, // user_current_hp recuperado do user_digimons
      effHp, // user_max_hp calculado
      'active'
    ];
    const sql = `INSERT INTO battles (${insertCols.join(', ')}) VALUES (${insertCols.map(() => '?').join(', ')})`;
    const [result] = await db.execute(sql, params);
    res.status(201).json({
      id: result.insertId,
      user: {
        id: userDigimon.id,
        name: userDigimon.name,
        hp: currentHp,
        max_hp: effHp,
        attack: effAtk,
        defense: effDef,
        xp: effXp,
        max_xp: nextLevelXp,
        level: level,
        sprite_path: userDigimon.sprite_path || null
      },
      enemy: {
        id: enemy.id,
        name: enemy.name,
        hp: Number(enemy.hp || 0),
        max_hp: Number(enemy.hp || 0),
        attack: Number(enemy.attack || 0),
        defense: Number(enemy.defense || 0),
        difficulty: enemy.difficulty || 'Normal',
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
    // Agora buscamos user_current_hp e user_max_hp da tabela battles
    const [battleRows] = await db.execute(`SELECT user_id, user_digimon_id, enemy_id, enemy_current_hp, enemy_max_hp, user_current_hp, user_max_hp FROM battles WHERE id=?`, [id]);
    const battle = battleRows && battleRows[0];
    if (!battle) return res.status(404).json({ message: 'Batalha não encontrada' });

    const mapping = await findPrincipalMappingTable();
    if (!mapping) return res.status(500).json({ message: 'Tabela users_digimons não encontrada' });
    const { table, digiIdCol } = mapping;
    // Fetch full user digimon details including extra stats
    const [mapRows] = await db.execute(`SELECT * FROM ${table} WHERE id=? LIMIT 1`, [battle.user_digimon_id]);
    const map = mapRows && mapRows[0];
    if (!map) return res.status(404).json({ message: 'Digimon do usuário não encontrado' });
    // Use the correct column for digimon_id based on mapping
    const digimonId = map[digiIdCol];
    const [digRows] = await db.execute('SELECT id, name, base_hp, base_attack, base_defense, sprite_path FROM digidex WHERE id=?', [digimonId]);
    const userDigimon = digRows && digRows[0];
    const [enemyRows] = await db.execute('SELECT id, name, hp, attack, defense, difficulty, sprite_path, exp_reward, bits_reward FROM enemydex WHERE id=?', [battle.enemy_id]);
    const enemy = enemyRows && enemyRows[0];

    // Calculate effective stats (prefer stored columns; fallback base + extras)
    const userCols = await getColumns(table);
    const atkCol = pick(userCols, ['attack', 'atk', 'ataque', 'forca']);
    const defCol = pick(userCols, ['defense', 'def', 'defesa']);
    const bonusAtk = getAttackBonus(map);
    const bonusDef = Number(map.extra_defense ?? 0);
    
    let userAtk = (atkCol ? Number(map[atkCol] || 0) : Number(userDigimon?.base_attack || 0)) + bonusAtk;
    console.log('Attack ATK calc:', { atkCol, base: Number(userDigimon?.base_attack || 0), stored: atkCol ? Number(map[atkCol] || 0) : null, bonus: bonusAtk, final: userAtk });
    let userDef = (defCol ? Number(map[defCol] || 0) : Number(userDigimon?.base_defense || 0)) + bonusDef;
    
    const enemyAtk = Number(enemy?.attack || 0);
    const enemyDef = Number(enemy?.defense || 0);

    const rawUserDamage = userAtk - enemyDef / 2;
    let userFactor = Math.random() < 0.8 ? (1.02 + Math.random() * 0.13) : (0.90 + Math.random() * 0.09);
    let isCrit = Math.random() < 0.35;
    if (isCrit) userFactor = 1.15;
    const userDamage = Math.max(1, Math.round(rawUserDamage * userFactor));
    const maxDamage = Math.max(1, Math.round(rawUserDamage * 1.15));

    const rawEnemyDamage = enemyAtk - userDef / 2;
    let enemyFactor = Math.random() < 0.8 ? (1.01 + Math.random() * 0.10) : (0.90 + Math.random() * 0.09);
    const enemyDamage = Math.max(1, Math.round(rawEnemyDamage * enemyFactor));

    const newEnemyHp = Math.max(0, Number(battle.enemy_current_hp ?? enemy.hp ?? 0) - userDamage);
    
    // Usar user_current_hp do banco se existir, senão calcular do máximo
    const currentHp = battle.user_current_hp !== null ? Number(battle.user_current_hp) : Number(battle.user_max_hp || userDigimon.base_hp);
    const newUserHp = Math.max(0, currentHp - enemyDamage);
    
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

    let win = false;
    let rewards = null;

    let extraLogs = [];

    if (newEnemyHp <= 0) {
      win = true;
      
      // Fetch global multipliers
      const [settings] = await db.execute('SELECT setting_key, setting_value FROM game_settings');
      let xpMult = 1;
      let bitsMult = 1;
      
      settings.forEach(s => {
          if (s.setting_key === 'global_xp_multiplier') xpMult = parseFloat(String(s.setting_value).replace(',', '.')) || 1;
          if (s.setting_key === 'global_bits_multiplier') bitsMult = parseFloat(String(s.setting_value).replace(',', '.')) || 1;
      });

      // Calcular recompensas usando dados do banco se disponíveis
      const baseXp = enemy.exp_reward ? Number(enemy.exp_reward) : Math.floor((Number(enemy.hp || 10) + Number(enemy.attack || 0)) / 2);
      const baseBits = enemy.bits_reward ? Number(enemy.bits_reward) : Math.floor(baseXp * 1.5);
      
      const xpGain = Math.floor(baseXp * xpMult);
      const bitsGain = Math.floor(baseBits * bitsMult);
      
      // --- DROP LOGIC ---
      const [drops] = await db.execute('SELECT ed.item_id, ed.drop_rate, i.name, i.icon, i.type, i.effect_target, i.effect_value, i.is_percent FROM enemy_drops ed JOIN items i ON ed.item_id = i.id WHERE ed.enemy_id = ?', [enemy.id]);
      
      const droppedItems = [];
      if (drops && drops.length > 0) {
          for (const drop of drops) {
              const chance = Number(drop.drop_rate);
              const roll = Math.random() * 100;
              if (roll <= chance) {
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

      // Atualizar user_digimons com XP
      const mapping = await findPrincipalMappingTable();
      if (mapping) {
        const { table, digiIdCol } = mapping;
        const userCols = await getColumns(table);
        const xpCol = pick(userCols, ['xp', 'experience', 'exp']);
        // const bitsCol = pick(userCols, ['bits', 'money', 'gold']); // Bits are stored in users table
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
        // if (bitsCol) {
        //   sets.push(`${bitsCol} = COALESCE(${bitsCol}, 0) + ?`);
        //   params.push(bitsGain);
        // }

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
                // Increase requirement by 20% or flat amount? 
                // User said "padrão 1000", but didn't specify growth. Let's use 1.2 multiplier.
                newExpM = Math.floor(newExpM * 1.2); 
                leveledUp = true;
            }

            await db.execute('UPDATE users SET exp = ?, exp_m = ?, level = ? WHERE id = ?', [newExp, newExpM, newLevel, battle.user_id]);
            
            if (leveledUp) {
                extraLogs.push(`Você subiu para o nível ${newLevel}!`);
            }
        }

        // --- LEVEL UP & EVOLUTION LOGIC ---
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

                let currentDigiId = freshUserDigimon[digiIdCol];
                let leveledUp = false;
                let evolved = false;

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

                // Evolution Check
                if (leveledUp) {
                    const [dexRows] = await db.execute('SELECT id, name, next_evolution_id, evolution_level, evolution_line_id FROM digidex WHERE id=?', [currentDigiId]);
                    const dexEntry = dexRows && dexRows[0];

                    if (dexEntry && dexEntry.next_evolution_id) {
                        const [targetRows] = await db.execute('SELECT id, name, evolution_line_id, evolution_level FROM digidex WHERE id=?', [dexEntry.next_evolution_id]);
                        const targetEntry = targetRows && targetRows[0];
                        const requiredLevel = targetEntry && targetEntry.evolution_level ? Number(targetEntry.evolution_level) : Number(dexEntry.evolution_level || 0);
                        
                        if (requiredLevel && currentLevel >= requiredLevel) {
                            if (targetEntry && targetEntry.evolution_line_id === dexEntry.evolution_line_id) {
                                currentDigiId = dexEntry.next_evolution_id;
                                evolved = true;
                                const newName = targetEntry.name;
                                extraLogs.push(`Seu Digimon digievoluiu para ${newName}!`);
                            }
                        }
                    }
                }

                if (leveledUp || evolved) {
                    const updates = [];
                    const updateParams = [];
                    
                    updates.push(`${xpCol} = ?`);
                    updateParams.push(currentXp);
                    
                    updates.push(`${levelCol} = ?`);
                    updateParams.push(currentLevel);
                    
                    if (hpCol) { updates.push(`${hpCol} = ?`); updateParams.push(currentHp); }
                    if (atkCol) { updates.push(`${atkCol} = ?`); updateParams.push(currentAtk); }
                    if (defCol) { updates.push(`${defCol} = ?`); updateParams.push(currentDef); }
                    
                    if (evolved) {
                        updates.push(`${digiIdCol} = ?`);
                        updateParams.push(currentDigiId);
                        
                        // Full heal on evolution?
                        // Let's verify if we should. Usually yes.
                        // But let's stick to user request "digievolui".
                        // I'll update max_hp/current_hp logic naturally happens in next fetch or implicit.
                        // But strictly, let's just update ID.
                    }
                    
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

       // Atualizar nome/sprite se houve evolução (digimon_id mudou)
       const digimonId2 = fullMap && mapping ? fullMap[mapping.digiIdCol] : null;
       if (digimonId2 && digimonId2 !== userDigimon?.id) {
         const [digRows2] = await db.execute('SELECT id, name, sprite_path FROM digidex WHERE id=?', [digimonId2]);
         if (digRows2 && digRows2[0]) {
           userName = digRows2[0].name;
           userSprite = digRows2[0].sprite_path || userSprite;
         }
       }
    }

    const nextLevelXp = level * 100;

    // Sincronizar max HP calculado com a batalha para próximos turnos
    await db.execute(`UPDATE battles SET user_max_hp=? WHERE id=?`, [effHp, id]);

    console.log('Attack Response - User Max HP:', effHp, 'Current HP:', newUserHp, 'Win:', win);

    res.json({
      id,
      win,
      rewards,
      user: {
        id: userDigimon?.id,
        name: userName,
        hp: newUserHp,
        max_hp: effHp,
        attack: userAtk,
        defense: userDef,
        xp: effXp + (win ? (rewards?.xp || 0) : 0),
        max_xp: nextLevelXp,
        level: level,
        sprite_path: userSprite
      },
      enemy: {
        id: enemy?.id,
        name: enemy?.name,
        hp: newEnemyHp,
        max_hp: Number(battle.enemy_max_hp ?? enemy.hp ?? 0),
        attack: enemyAtk,
        defense: enemyDef,
        difficulty: enemy?.difficulty || 'Normal',
        sprite_path: enemy?.sprite_path || null
      },
      crit: isCrit,
      user_damage: userDamage,
      enemy_damage: enemyDamage,
      log: [
        `Você causou ${userDamage} de dano`,
        `Você tomou ${enemyDamage} de dano`,
        ...(isCrit ? ['Golpe Crítico!'] : []),
        ...extraLogs
      ]
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

    let enemyQuery = 'SELECT id, name, hp, attack, defense, difficulty, sprite_path FROM enemydex';
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

    await db.execute(`UPDATE battles SET enemy_id=?, enemy_current_hp=?, enemy_max_hp=? WHERE id=?`, [enemy.id, Number(enemy.hp || 0), Number(enemy.hp || 0), id]);

    res.json({
      id,
      enemy: {
        id: enemy.id,
        name: enemy.name,
        hp: Number(enemy.hp || 0),
        attack: Number(enemy.attack || 0),
        defense: Number(enemy.defense || 0),
        difficulty: enemy.difficulty || 'Normal',
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
