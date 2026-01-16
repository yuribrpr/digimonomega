const db = require('../config/db');
const { resolveUserDigimonsTable } = require('../utils/dbHelpers');

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
            evolution_line_id, next_evolution_id, evolution_level, base_level,
            required_item_id, required_item_quantity
        } = req.body;
        
        const sprite_path = req.file ? `assets/sprites/${req.file.filename}` : null;

        const nextEvoId = next_evolution_id || null;
        const evoLevel = evolution_level || null;
        const bLevel = base_level || 1;
        const reqItemId = required_item_id || 12; // Default to Evoluter
        const reqItemQty = required_item_quantity || 0;

        const [result] = await db.execute(
            'INSERT INTO digidex (name, type, base_hp, base_attack, base_defense, evolution_line_id, next_evolution_id, evolution_level, base_level, sprite_path, required_evoluters, required_item_id, required_item_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, type, base_hp, base_attack, base_defense, evolution_line_id, nextEvoId, evoLevel, bLevel, sprite_path, reqItemQty, reqItemId, reqItemQty]
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
            evolution_line_id, next_evolution_id, evolution_level, base_level, required_evoluters,
            required_item_id, required_item_quantity
        } = req.body;
        
        const nextEvoId = next_evolution_id || null;
        const evoLevel = evolution_level || null;
        const bLevel = base_level || 1;
        
        // Handle both old and new field names for backward compatibility
        // If required_item_quantity is provided, use it. Else fallback to required_evoluters.
        const reqItemQty = required_item_quantity !== undefined ? required_item_quantity : (required_evoluters || 0);
        const reqItemId = required_item_id || 12; // Default to Evoluter if not specified

        let query = 'UPDATE digidex SET name=?, type=?, base_hp=?, base_attack=?, base_defense=?, evolution_line_id=?, next_evolution_id=?, evolution_level=?, base_level=?, required_evoluters=?, required_item_id=?, required_item_quantity=?';
        let params = [name, type, base_hp, base_attack, base_defense, evolution_line_id, nextEvoId, evoLevel, bLevel, reqItemQty, reqItemId, reqItemQty];

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

        const [udRows] = await db.execute(`SELECT * FROM ${table} WHERE id = ?`, [userDigimonId]);
        if (udRows.length === 0) return res.status(404).json({ message: 'Digimon not found' });
        const userDigimon = udRows[0];

        // Get current species info to find the line
        const [dexRows] = await db.execute('SELECT * FROM digidex WHERE id = ?', [userDigimon[digiIdCol]]);
        if (dexRows.length === 0) return res.status(404).json({ message: 'Species not found' });
        const currentSpecies = dexRows[0];

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
        const { userDigimonId, targetDigidexId } = req.body;
        const userId = req.user.id;

        const mapping = await resolveUserDigimonsTable();
        const { table, digiIdCol } = mapping;

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

        const newMaxHp = userDigimon.max_hp + diffHp;
        const newAtk = userDigimon.attack + diffAtk;
        const newDef = userDigimon.defense + diffDef;

        await db.execute(
            `UPDATE ${table} SET ${digiIdCol} = ?, max_hp = ?, attack = ?, defense = ? WHERE id = ?`,
            [targetDigidexId, newMaxHp, newAtk, newDef, userDigimonId]
        );
        
        // Heal to full on evolution
        await db.execute(`UPDATE ${table} SET current_hp = max_hp WHERE id = ?`, [userDigimonId]);

        res.json({ message: 'Digimon evolved!', newSpecies: targetSpecies });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error evolving digimon' });
    }
};
