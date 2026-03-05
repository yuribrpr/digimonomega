const db = require('../config/db');
const { resolveUserDigimonsTable } = require('../utils/dbHelpers');

async function ensureDigidexColumns() {
    try {
        // 1. Ensure Columns in digidex
        const [cols] = await db.execute('DESCRIBE digidex');
        const names = cols.map(c => c.Field);
        
        const alterQueries = [];
        if (!names.includes('evolution_line_id')) alterQueries.push("ADD COLUMN evolution_line_id VARCHAR(100) DEFAULT NULL");
        if (!names.includes('next_evolution_id')) alterQueries.push("ADD COLUMN next_evolution_id INT DEFAULT NULL");
        if (!names.includes('base_level')) alterQueries.push("ADD COLUMN base_level INT DEFAULT 1");
        if (!names.includes('sprite_path')) alterQueries.push("ADD COLUMN sprite_path VARCHAR(255) DEFAULT NULL");
        if (!names.includes('required_evoluters')) alterQueries.push("ADD COLUMN required_evoluters INT DEFAULT 0");
        if (!names.includes('required_item_id')) alterQueries.push("ADD COLUMN required_item_id INT DEFAULT 12");
        if (!names.includes('required_item_quantity')) alterQueries.push("ADD COLUMN required_item_quantity INT DEFAULT 0");
        if (!names.includes('base_attack_speed')) alterQueries.push("ADD COLUMN base_attack_speed FLOAT DEFAULT 2.0");
        if (!names.includes('is_starter')) alterQueries.push("ADD COLUMN is_starter TINYINT(1) DEFAULT 0");

        for (const query of alterQueries) {
            await db.execute(`ALTER TABLE digidex ${query}`);
        }

        // 2. Ensure Default Evoluter Item (ID 12) exists
        // This is crucial because required_item_id defaults to 12
        const [items] = await db.execute('SELECT id FROM items WHERE id = 12');
        if (items.length === 0) {
            console.log('Ensuring Evoluter item (ID 12) exists...');
            // Note: matching columns from itemController.js (name, description, icon, type, effect_target, effect_value, is_percent)
            await db.execute(`
                INSERT INTO items (id, name, description, icon, type, effect_target, effect_value, is_percent)
                VALUES (12, 'Evoluter', 'Item used to unlock evolutions.', 'assets/items/evoluter.png', 'consumable', 'none', 0, 0)
            `);
        }
    } catch (error) {
        console.error('Error in ensureDigidexColumns:', error);
        // Don't block the request if this fails, but log it. 
        // Although if it fails, the main query might fail too.
    }
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
                u.id as owner_id,
                u.username as owner_name,
                d.name as species_name,
                d.sprite_path,
                d.base_attack_speed,
                (${powerCalc}) as total_power
            FROM ${table} ud
            JOIN ${usersTable} u ON ud.${userIdCol} = u.id
            JOIN ${digidexTable} d ON ud.${digiIdCol} = d.id
            ORDER BY total_power DESC, ud.level DESC
            LIMIT 10
        `;
        
        const [rows] = await db.execute(sql);
        // Override attack_speed with base_attack_speed for display consistency if needed
        const result = rows.map(r => ({
            ...r,
            attack_speed: r.base_attack_speed || r.attack_speed || 2.0
        }));

        res.json(result);
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
        await ensureDigidexColumns();
        const { 
            name, type, base_hp, base_attack, base_defense,
            evolution_line_id, next_evolution_id, evolution_level, base_level,
            required_item_id, required_item_quantity, base_attack_speed, is_starter
        } = req.body;
        
        const sprite_path = req.file ? `assets/sprites/${req.file.filename}` : null;

        const nextEvoId = next_evolution_id || null;
        const evoLevel = evolution_level || null;
        const bLevel = base_level || 1;
        const reqItemId = required_item_id || 12; // Default to Evoluter
        const reqItemQty = required_item_quantity || 0;
        const bAtkSpeed = base_attack_speed || 2.0;
        const starterFlag = is_starter === true || is_starter === 1 || String(is_starter).toLowerCase() === 'true' ? 1 : 0;

        const [result] = await db.execute(
            'INSERT INTO digidex (name, type, base_hp, base_attack, base_defense, base_attack_speed, evolution_line_id, next_evolution_id, evolution_level, base_level, sprite_path, required_evoluters, required_item_id, required_item_quantity, is_starter) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, type, base_hp, base_attack, base_defense, bAtkSpeed, evolution_line_id, nextEvoId, evoLevel, bLevel, sprite_path, reqItemQty, reqItemId, reqItemQty, starterFlag]
        );
        res.status(201).json({ message: 'Digimon created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating digimon', error: error.sqlMessage || error.message || String(error) });
    }
};

exports.updateDigimon = async (req, res) => {
    try {
        await ensureDigidexColumns();
        const { id } = req.params;
        const { 
            name, type, base_hp, base_attack, base_defense,
            evolution_line_id, next_evolution_id, evolution_level, base_level, required_evoluters,
            required_item_id, required_item_quantity, base_attack_speed, is_starter
        } = req.body;

        const [rows] = await db.execute('SELECT * FROM digidex WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Digimon not found' });
        }
        const existing = rows[0];

        const numOr = (val, fallback) => {
            if (val === undefined || val === null || val === '') return fallback;
            const n = Number(val);
            return Number.isNaN(n) ? fallback : n;
        };

        const newName = typeof name !== 'undefined' && name !== '' ? name : existing.name;
        const newType = typeof type !== 'undefined' && type !== '' ? type : existing.type;
        const newBaseHp = numOr(base_hp, existing.base_hp);
        const newBaseAttack = numOr(base_attack, existing.base_attack);
        const newBaseDefense = numOr(base_defense, existing.base_defense);
        const newBaseAtkSpeed = numOr(base_attack_speed, existing.base_attack_speed || 2.0);

        const newEvolutionLineId = typeof evolution_line_id !== 'undefined' && evolution_line_id !== '' ? evolution_line_id : existing.evolution_line_id;
        const nextEvoId = typeof next_evolution_id !== 'undefined' && next_evolution_id !== '' ? next_evolution_id : existing.next_evolution_id;
        const evoLevel = numOr(evolution_level, existing.evolution_level);
        const bLevel = numOr(base_level, existing.base_level || 1);

        const rawQty = required_item_quantity !== undefined && required_item_quantity !== ''
            ? required_item_quantity
            : (required_evoluters !== undefined && required_evoluters !== '' ? required_evoluters : (existing.required_item_quantity ?? existing.required_evoluters ?? 0));
        const reqItemQty = numOr(rawQty, 0);

        const reqItemId = required_item_id !== undefined && required_item_id !== ''
            ? required_item_id
            : (existing.required_item_id || 12);
        const starterFlag = is_starter !== undefined
            ? (is_starter === true || is_starter === 1 || String(is_starter).toLowerCase() === 'true' ? 1 : 0)
            : Number(existing.is_starter || 0);

        let query = 'UPDATE digidex SET name=?, type=?, base_hp=?, base_attack=?, base_defense=?, base_attack_speed=?, evolution_line_id=?, next_evolution_id=?, evolution_level=?, base_level=?, required_evoluters=?, required_item_id=?, required_item_quantity=?, is_starter=?';
        let params = [newName, newType, newBaseHp, newBaseAttack, newBaseDefense, newBaseAtkSpeed, newEvolutionLineId, nextEvoId, evoLevel, bLevel, reqItemQty, reqItemId, reqItemQty, starterFlag];

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
        res.status(500).json({ message: 'Error updating digimon', error: error.sqlMessage || error.message || String(error) });
    }
};

exports.deleteDigimon = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM digidex WHERE id=?', [id]);
        res.json({ message: 'Digimon deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting digimon' });
    }
};

// --- Evolution System ---

exports.getEvolutionLine = async (req, res) => {
    try {
        const { userDigimonId } = req.params;
        
        // Get user digimon info
        const mapping = await resolveUserDigimonsTable();
        if (!mapping) return res.status(500).json({ message: 'Table error' });
        const { table, userIdCol, digiIdCol } = mapping;

        // Fetch user digimon AND current species info in one go or sequentially
        const [udRows] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [userDigimonId]);
        if (udRows.length === 0) return res.status(404).json({ message: 'Digimon not found' });
        const userDigimon = udRows[0];

        // Get current species info to find the line
        // Also fetching base_attack_speed to return to frontend if needed
        const [dexRows] = await db.execute('SELECT * FROM digidex WHERE id = ?', [userDigimon[digiIdCol]]);
        if (dexRows.length === 0) return res.status(404).json({ message: 'Species not found' });
        const currentSpecies = dexRows[0];
        
        // Override stored stats with base stats from Digidex if they are missing or if we want live data?
        // Actually, the user panel displays what's in the DB.
        // But the user reported: "no painel do digimon (onde mostra os atributos) tá aprecendo 2s".
        // This implies the frontend is displaying `userDigimon.attack_speed` which might be stale (2.0) in the `user_digimons` table.
        // We should probably return the `base_attack_speed` from `currentSpecies` as the source of truth for display if we want to reflect admin changes.
        // Let's inject it into the returned userDigimon object for the frontend to use.
        userDigimon.attack_speed = currentSpecies.base_attack_speed || 2.0;

        // Get all digimons in this line
        // If evolution_line_id is null, it might be a standalone or base.
        // We'll search for anything sharing the same evolution_line_id, OR linked via next_evolution_id graph.
        // Assuming evolution_line_id is consistently used.
        let lineQuery = `
            SELECT d.*, i.name as required_item_name, i.icon as required_item_icon 
            FROM digidex d 
            LEFT JOIN items i ON d.required_item_id = i.id 
            WHERE d.evolution_line_id = ? 
            ORDER BY d.base_level ASC
        `;
        let lineParams = [currentSpecies.evolution_line_id];
        
        if (!currentSpecies.evolution_line_id) {
            // Fallback: try to find connected nodes (simple up/down 1 level check or just return itself)
            // For now, return just itself if no line ID
             lineQuery = `
                SELECT d.*, i.name as required_item_name, i.icon as required_item_icon 
                FROM digidex d 
                LEFT JOIN items i ON d.required_item_id = i.id 
                WHERE d.id = ?
             `;
             lineParams = [currentSpecies.id];
        }

        const [lineRows] = await db.execute(lineQuery, lineParams);
        
        // Parse unlocked evolutions
        let unlockedIds = [];
        try {
            if (userDigimon.unlocked_evolutions) {
                unlockedIds = typeof userDigimon.unlocked_evolutions === 'string' 
                    ? JSON.parse(userDigimon.unlocked_evolutions) 
                    : userDigimon.unlocked_evolutions;
            } else {
                // Fallback if null (shouldn't happen with migration, but safe check)
                unlockedIds = [userDigimon[digiIdCol]]; 
            }
        } catch (e) {
            unlockedIds = [userDigimon[digiIdCol]];
        }

        res.json({
            userDigimon,
            currentSpecies,
            line: lineRows,
            unlockedIds
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching evolution line' });
    }
};

exports.unlockEvolution = async (req, res) => {
    try {
        const { userDigimonId, targetDigidexId } = req.body;
        const userId = req.user.id; // Assuming auth middleware adds this

        const mapping = await resolveUserDigimonsTable();
        const { table } = mapping;

        // 1. Get User Digimon
        const [udRows] = await db.execute(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [userDigimonId, userId]);
        if (udRows.length === 0) return res.status(404).json({ message: 'Digimon not found' });
        const userDigimon = udRows[0];

        // 2. Get Target Species
        const [targetRows] = await db.execute('SELECT * FROM digidex WHERE id = ?', [targetDigidexId]);
        if (targetRows.length === 0) return res.status(404).json({ message: 'Target species not found' });
        const targetSpecies = targetRows[0];

        // 3. Check Requirements
        // a. Check if already unlocked
        let unlockedIds = [];
        try {
            unlockedIds = userDigimon.unlocked_evolutions ? JSON.parse(userDigimon.unlocked_evolutions) : [];
        } catch (e) {}

        if (unlockedIds.includes(Number(targetDigidexId))) {
            return res.status(400).json({ message: 'Evolution already unlocked' });
        }

        // b. Check Level
        if (userDigimon.level < targetSpecies.evolution_level) {
            return res.status(400).json({ message: `Level ${targetSpecies.evolution_level} required` });
        }

        // c. Check Items
        const requiredItemId = targetSpecies.required_item_id || 12; // Default to Evoluter (ID 12)
        const requiredQty = targetSpecies.required_item_quantity !== undefined ? targetSpecies.required_item_quantity : (targetSpecies.required_evoluters || 0);
        
        if (requiredQty > 0) {
            const [invRows] = await db.execute('SELECT quantity FROM inventory WHERE user_id = ? AND item_id = ?', [userId, requiredItemId]);
            const userQty = invRows.length > 0 ? invRows[0].quantity : 0;

            if (userQty < requiredQty) {
                // Get item name for error message
                const [itemRows] = await db.execute('SELECT name FROM items WHERE id = ?', [requiredItemId]);
                const itemName = itemRows[0]?.name || 'Item';
                return res.status(400).json({ message: `Insufficient ${itemName}. Need ${requiredQty}` });
            }

            // Deduct items
            await db.execute('UPDATE inventory SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?', [requiredQty, userId, requiredItemId]);
            // Clean up if 0? Usually keep 0 or delete. Keeping is fine.
        }

        // 4. Unlock
        unlockedIds.push(Number(targetDigidexId));
        await db.execute(`UPDATE ${table} SET unlocked_evolutions = ? WHERE id = ?`, [JSON.stringify(unlockedIds), userDigimonId]);

        res.json({ message: 'Evolution unlocked!', unlockedIds });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error unlocking evolution' });
    }
};

exports.evolveDigimon = async (req, res) => {
    try {
        const { userDigimonId, targetDigidexId, battleId } = req.body;
        const userId = req.user.id;

        const mapping = await resolveUserDigimonsTable();
        const { table, digiIdCol, userIdCol } = mapping;

        // 1. Get User Digimon
        const [udRows] = await db.execute(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`, [userDigimonId, userId]);
        if (udRows.length === 0) return res.status(404).json({ message: 'Digimon not found' });
        const userDigimon = udRows[0];

        // Get Current Species (to calculate stat diffs)
        const [currentSpeciesRows] = await db.execute('SELECT * FROM digidex WHERE id = ?', [userDigimon[digiIdCol]]);
        if (currentSpeciesRows.length === 0) return res.status(404).json({ message: 'Current species not found' });
        const currentSpecies = currentSpeciesRows[0];

        // 2. Check if unlocked
        let unlockedIds = [];
        try {
            unlockedIds = userDigimon.unlocked_evolutions ? JSON.parse(userDigimon.unlocked_evolutions) : [];
        } catch (e) {}

        if (!unlockedIds.includes(Number(targetDigidexId))) {
            return res.status(400).json({ message: 'Evolution not unlocked' });
        }

        // 3. Evolve (Switch Form)
        // Calculate stat differences to preserve extra attributes (items, etc)
        const [targetRows] = await db.execute('SELECT * FROM digidex WHERE id = ?', [targetDigidexId]);
        if (targetRows.length === 0) return res.status(404).json({ message: 'Target species not found' });
        const targetSpecies = targetRows[0];

        const diffHp = targetSpecies.base_hp - currentSpecies.base_hp;
        const diffAtk = targetSpecies.base_attack - currentSpecies.base_attack;
        const diffDef = targetSpecies.base_defense - currentSpecies.base_defense;
        const diffSpeed = (targetSpecies.base_attack_speed || 2.0) - (currentSpecies.base_attack_speed || 2.0);

        const newMaxHp = userDigimon.max_hp + diffHp;
        const newAtk = userDigimon.attack + diffAtk;
        const newDef = userDigimon.defense + diffDef;
        const newSpeed = (userDigimon.attack_speed || 2.0) + diffSpeed;

        await db.execute(
            `UPDATE ${table} SET ${digiIdCol} = ?, max_hp = ?, attack = ?, defense = ?, attack_speed = ? WHERE id = ?`,
            [targetDigidexId, newMaxHp, newAtk, newDef, newSpeed, userDigimonId]
        );
        
        // Heal to full on evolution
        await db.execute(`UPDATE ${table} SET current_hp = max_hp WHERE id = ?`, [userDigimonId]);

        // Return updated instance for realtime UIs (battle, etc)
        const [updatedRows] = await db.execute(`SELECT * FROM ${table} WHERE id = ? LIMIT 1`, [userDigimonId]);
        const updatedUserDigimon = updatedRows && updatedRows[0] ? updatedRows[0] : null;

        // Optional battle sync: keep battle HP caps in sync after form switch
        let battleSync = null;
        if (battleId && updatedUserDigimon) {
            try {
                const [battleRows] = await db.execute(
                    `SELECT id, user_id, user_digimon_id, status FROM battles WHERE id = ? LIMIT 1`,
                    [battleId]
                );
                const battle = battleRows && battleRows[0] ? battleRows[0] : null;
                const ownerId = Number(updatedUserDigimon[userIdCol] || userId);
                if (
                    battle &&
                    Number(battle.user_digimon_id) === Number(userDigimonId) &&
                    Number(battle.user_id) === ownerId &&
                    String(battle.status || '').toLowerCase() === 'active'
                ) {
                    const syncedHp = Number(updatedUserDigimon.max_hp || newMaxHp);
                    await db.execute(
                        'UPDATE battles SET user_current_hp = ?, user_max_hp = ? WHERE id = ?',
                        [syncedHp, syncedHp, battleId]
                    );
                    battleSync = {
                        battle_id: Number(battleId),
                        user_current_hp: syncedHp,
                        user_max_hp: syncedHp
                    };
                }
            } catch (battleSyncErr) {
                console.error('Error syncing evolve with battle:', battleSyncErr);
            }
        }

        res.json({
            message: 'Digimon evolved!',
            newSpecies: targetSpecies,
            userDigimon: updatedUserDigimon,
            battleSync
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error evolving digimon' });
    }
};
