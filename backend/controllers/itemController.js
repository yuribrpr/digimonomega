const db = require('../config/db');

exports.createItem = async (req, res) => {
  try {
    const { 
      name, description, type, 
      effect_target, effect_value, is_percent 
    } = req.body;
    
    const icon_path = req.file ? `assets/items/${req.file.filename}` : null;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and Type are required' });
    }

    const [result] = await db.execute(
      `INSERT INTO items (
        name, description, icon, type, 
        effect_target, effect_value, is_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name, description || null, icon_path, type,
        effect_target || 'none', effect_value || 0, is_percent === 'true' || is_percent === true ? 1 : 0
      ]
    );

    res.status(201).json({ message: 'Item created', id: result.insertId });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Error creating item', error: error.message });
  }
};

exports.getAllItems = async (req, res) => {
  try {
    const [items] = await db.execute('SELECT * FROM items ORDER BY created_at DESC');
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Error fetching items' });
  }
};

exports.getUserInventory = async (req, res) => {
  try {
    const { userId } = req.params;
    const [inventory] = await db.execute(`
      SELECT i.*, inv.quantity, inv.id as inventory_id
      FROM inventory inv
      JOIN items i ON inv.item_id = i.id
      WHERE inv.user_id = ?
    `, [userId]);
    
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Error fetching inventory' });
  }
};

// Admin helper to delete items
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting item' });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      effect_target,
      effect_value,
      is_percent
    } = req.body;

    const [rows] = await db.execute('SELECT * FROM items WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Item não encontrado' });
    const existing = rows[0];

    let icon_path = existing.icon;
    if (req.file) {
      icon_path = `assets/items/${req.file.filename}`;
    }

    const newName = typeof name !== 'undefined' ? name : existing.name;
    const newDesc = typeof description !== 'undefined' ? description : existing.description;
    const newType = typeof type !== 'undefined' ? type : existing.type;
    const newTarget = typeof effect_target !== 'undefined' ? effect_target : existing.effect_target;
    const newValue = typeof effect_value !== 'undefined' ? effect_value : existing.effect_value;
    const newIsPercent = typeof is_percent !== 'undefined'
      ? (is_percent === 'true' || is_percent === true ? 1 : 0)
      : existing.is_percent;

    await db.execute(
      `UPDATE items 
       SET name = ?, description = ?, icon = ?, type = ?, effect_target = ?, effect_value = ?, is_percent = ?
       WHERE id = ?`,
      [newName, newDesc, icon_path, newType, newTarget, newValue, newIsPercent, id]
    );

    res.json({ message: 'Item atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Erro ao atualizar item', error: error.message });
  }
};

exports.useItem = async (req, res) => {
  try {
    const { userId, itemId, quantity = 1 } = req.body;
    const qtyToUse = Math.max(1, parseInt(quantity));
    
    // 1. Check inventory
    const [invRows] = await db.execute('SELECT * FROM inventory WHERE user_id = ? AND item_id = ?', [userId, itemId]);
    const inventoryItem = invRows && invRows[0];
    if (!inventoryItem || inventoryItem.quantity < qtyToUse) {
        return res.status(400).json({ message: `Você não possui ${qtyToUse} deste item.` });
    }

    // 2. Get Item Details
    const [itemRows] = await db.execute('SELECT * FROM items WHERE id = ?', [itemId]);
    const item = itemRows && itemRows[0];
    if (!item) return res.status(404).json({ message: 'Item não encontrado.' });

    if (item.type !== 'consumable') {
        return res.status(400).json({ message: 'Este item não pode ser usado.' });
    }

    // 3. Find User's Main Digimon
    // Simple table finder
    const [tables] = await db.execute("SHOW TABLES LIKE '%user%digimon%'");
    const table = tables.length > 0 ? Object.values(tables[0])[0] : 'users_digimons';
    
    // Find main digimon
    const [digiRows] = await db.execute(`SELECT * FROM ${table} WHERE user_id = ? AND is_main = 1 LIMIT 1`, [userId]);
    let userDigimon = digiRows && digiRows[0];
    
    // Fallback to any digimon if no main
    if (!userDigimon) {
        const [anyRows] = await db.execute(`SELECT * FROM ${table} WHERE user_id = ? LIMIT 1`, [userId]);
        userDigimon = anyRows && anyRows[0];
    }

    if (!userDigimon) return res.status(400).json({ message: 'Você não possui um Digimon ativo.' });

    // 4. Apply Effect
    const target = item.effect_target; // hp, attack, defense
    const value = Number(item.effect_value);
    const isPercent = item.is_percent;

    let success = false;
    let message = '';

    if (target === 'hp') {
        let maxHp = Number(userDigimon.max_hp || 100);
        let singleInc = isPercent ? Math.floor(maxHp * (value / 100)) : value;
        let totalInc = singleInc * qtyToUse;
        const [cols] = await db.execute(`DESCRIBE ${table}`);
        const hpExtraCol = cols.find(c => c.Field === 'extra_hp') ? 'extra_hp' : null;
        if (!hpExtraCol) {
            return res.status(400).json({ message: 'Coluna extra_hp não encontrada.' });
        }
        await db.execute(`UPDATE ${table} SET ${hpExtraCol} = COALESCE(${hpExtraCol}, 0) + ? WHERE id = ?`, [totalInc, userDigimon.id]);
        const [checkRows] = await db.execute(`SELECT ${hpExtraCol} FROM ${table} WHERE id=?`, [userDigimon.id]);
        success = true;
        message = `Usou ${qtyToUse}x ${item.name}. HP máximo aumentou em ${totalInc}!`;
    } else if (target === 'attack' || target === 'defense') {
        const colMap = {
            'attack': ['extra_attack', 'attack_bonus', 'atk_bonus'],
            'defense': ['extra_defense', 'defense_bonus', 'def_bonus']
        };
        
        const possibleCols = colMap[target];
        const [cols] = await db.execute(`DESCRIBE ${table}`);
        const targetCol = possibleCols.find(c => cols.find(dbCol => dbCol.Field === c)) || (target === 'attack' ? 'extra_attack' : 'extra_defense');
        const colExists = cols.find(dbCol => dbCol.Field === targetCol);
        
        if (colExists) {
             const totalValue = value * qtyToUse;
             await db.execute(`UPDATE ${table} SET ${targetCol} = COALESCE(${targetCol}, 0) + ? WHERE id = ?`, [totalValue, userDigimon.id]);
             const [checkRows] = await db.execute(`SELECT ${targetCol} FROM ${table} WHERE id=?`, [userDigimon.id]);
             console.log('Item aplicado:', { item: item.name, qty: qtyToUse, target: targetCol, novo_valor: checkRows && checkRows[0] ? checkRows[0][targetCol] : null });
             success = true;
             message = `Usou ${qtyToUse}x ${item.name}. ${target === 'attack' ? 'Ataque' : 'Defesa'} aumentou em ${totalValue}!`;
        } else {
             return res.status(400).json({ message: `Não foi possível aplicar o efeito de ${target}.` });
        }
    } else {
        return res.status(400).json({ message: 'Efeito desconhecido.' });
    }

    if (success) {
        // 5. Consume Item
        if (inventoryItem.quantity > qtyToUse) {
            await db.execute('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [qtyToUse, inventoryItem.id]);
        } else {
            await db.execute('DELETE FROM inventory WHERE id = ?', [inventoryItem.id]);
        }
        
        res.json({ success: true, message, itemId, remaining: inventoryItem.quantity - qtyToUse });
    } else {
        res.status(400).json({ message: 'Falha ao usar item.' });
    }

  } catch (error) {
    console.error('Error using item:', error);
    res.status(500).json({ message: 'Erro ao usar item', error: error.message });
  }
};

exports.discardItem = async (req, res) => {
  try {
    const { userId, itemId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity));
    const [invRows] = await db.execute('SELECT * FROM inventory WHERE user_id = ? AND item_id = ?', [userId, itemId]);
    const inventoryItem = invRows && invRows[0];
    if (!inventoryItem || Number(inventoryItem.quantity) < qty) {
      return res.status(400).json({ message: `Quantidade insuficiente para descartar.` });
    }
    if (Number(inventoryItem.quantity) > qty) {
      await db.execute('UPDATE inventory SET quantity = quantity - ? WHERE id = ?', [qty, inventoryItem.id]);
    } else {
      await db.execute('DELETE FROM inventory WHERE id = ?', [inventoryItem.id]);
    }
    res.json({ success: true, message: `Descartou ${qty}x item.`, itemId, remaining: Number(inventoryItem.quantity) - qty });
  } catch (error) {
    console.error('Error discarding item:', error);
    res.status(500).json({ message: 'Erro ao descartar item', error: error.message });
  }
};
