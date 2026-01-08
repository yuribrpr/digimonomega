const db = require('../config/db');

// Helper to find the correct table name for user digimons
async function getUserDigimonTable() {
    const [rows] = await db.execute("SHOW TABLES LIKE '%user%digimon%'");
    if (rows.length > 0) {
        return Object.values(rows[0])[0];
    }
    return 'user_digimons'; // Fallback
}

exports.getAvailable = async (req, res) => {
    try {
        // Filter for Rookies (base_level = 1)
        const [rows] = await db.execute('SELECT id, name, type, base_hp, base_attack, base_defense, sprite_path FROM digidex WHERE base_level = 1');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar digimons', error: error.message });
    }
};

exports.adopt = async (req, res) => {
    try {
        const { user_id, digimon_id, nickname } = req.body;
        
        if (!user_id || !digimon_id) {
            return res.status(400).json({ message: 'Dados incompletos' });
        }

        const table = await getUserDigimonTable();
        
        // Check if user already has this digimon? (Optional, user didn't specify unique restriction)
        // User said "loja gratuita que ele pode adotar digimons novos".
        // Usually adoption allows duplicates.
        
        // Insert
        // Default values: level=1, exp=0. is_main=0 (unless it's their first?)
        // Check if user has any digimon
        const [existing] = await db.execute(`SELECT count(*) as count FROM ${table} WHERE user_id=?`, [user_id]);
        const isFirst = existing[0].count === 0;

        // Need to get base stats
        const [digiRows] = await db.execute('SELECT base_hp, base_attack, base_defense FROM digidex WHERE id=?', [digimon_id]);
        const baseHp = digiRows[0]?.base_hp || 100;
        const baseAttack = digiRows[0]?.base_attack || 10;
        const baseDefense = digiRows[0]?.base_defense || 10;

        const sql = `INSERT INTO ${table} (user_id, digidex_id, nickname, level, exp, current_hp, max_hp, attack, defense, is_main) VALUES (?, ?, ?, 1, 0, ?, ?, ?, ?, ?)`;
        
        await db.execute(sql, [user_id, digimon_id, nickname || null, baseHp, baseHp, baseAttack, baseDefense, isFirst ? 1 : 0]);

        res.status(201).json({ message: 'Digimon adotado com sucesso!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao adotar', error: error.message });
    }
};
