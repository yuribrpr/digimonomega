const db = require('../config/db');

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM game_settings');
    
    const defaults = [
        ['global_xp_multiplier', '1', 'Multiplicador Global de XP'],
        ['global_bits_multiplier', '1', 'Multiplicador Global de Bits']
    ];
    
    let missing = false;
    for (const [key, value, desc] of defaults) {
        if (!rows.find(r => r.setting_key === key)) {
             await db.execute(
                'INSERT IGNORE INTO game_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
                [key, value, desc]
            );
            missing = true;
        }
    }
    
    if (missing) {
        const [newRows] = await db.execute('SELECT * FROM game_settings');
        return res.json(newRows);
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching game settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update a setting
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
        return res.status(400).json({ message: 'Value is required' });
    }

    await db.execute(
        'UPDATE game_settings SET setting_value = ? WHERE setting_key = ?',
        [value, key]
    );
    
    res.json({ message: 'Setting updated successfully', key, value });
  } catch (error) {
    console.error('Error updating game setting:', error);
    res.status(500).json({ message: 'Error updating setting' });
  }
};
