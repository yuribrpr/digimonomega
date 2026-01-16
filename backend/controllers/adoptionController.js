const db = require('../config/db');
const { resolveUserDigimonsTable } = require('../utils/dbHelpers');

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

        const mapping = await resolveUserDigimonsTable();
        if (!mapping || !mapping.userIdCol || !mapping.digiIdCol) {
            return res.status(500).json({ message: 'Erro na configuração do banco de dados (tabela user_digimons)' });
        }
        const { table, userIdCol, digiIdCol } = mapping;
        
        // Verify Digimon exists (Prevent FK Error)
        const [digiRows] = await db.execute('SELECT id, base_hp, base_attack, base_defense FROM digidex WHERE id=?', [digimon_id]);
        if (digiRows.length === 0) {
            return res.status(404).json({ message: 'Digimon não encontrado no Digidex' });
        }
        const digimon = digiRows[0];
        
        // Check if user has any digimon (to determine is_main)
        const [existing] = await db.execute(`SELECT count(*) as count FROM ${table} WHERE ${userIdCol}=?`, [user_id]);
        const isFirst = existing[0].count === 0;

        const baseHp = digimon.base_hp || 100;
        const baseAttack = digimon.base_attack || 10;
        const baseDefense = digimon.base_defense || 10;

        const sql = `INSERT INTO ${table} (${userIdCol}, ${digiIdCol}, nickname, level, exp, current_hp, max_hp, attack, defense, is_main) VALUES (?, ?, ?, 1, 0, ?, ?, ?, ?, ?)`;
        
        await db.execute(sql, [user_id, digimon_id, nickname || null, baseHp, baseHp, baseAttack, baseDefense, isFirst ? 1 : 0]);

        res.status(201).json({ message: 'Digimon adotado com sucesso!' });

    } catch (error) {
        console.error('Erro ao adotar:', error);
        res.status(500).json({ message: 'Erro ao adotar', error: error.message });
    }
};
