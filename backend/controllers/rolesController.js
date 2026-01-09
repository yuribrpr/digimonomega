const db = require('../config/db');

// Get all roles with their permissions
exports.getRoles = async (req, res) => {
  try {
    const [roles] = await db.execute('SELECT * FROM roles');
    
    // For each role, get permissions
    for (let role of roles) {
      const [perms] = await db.execute(`
        SELECT p.* FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `, [role.id]);
      role.permissions = perms;
    }
    
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar roles', error: error.message });
  }
};

// Get all available permissions
exports.getPermissions = async (req, res) => {
  try {
    const [permissions] = await db.execute('SELECT * FROM permissions');
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar permissões', error: error.message });
  }
};

// Create a new role
exports.createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Nome da role é obrigatório' });

    await db.execute('INSERT INTO roles (name, description) VALUES (?, ?)', [name, description]);
    res.status(201).json({ message: 'Role criada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar role', error: error.message });
  }
};

// Update role permissions
exports.updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body; // Array of permission_ids

    // Clear existing permissions
    await db.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);

    // Insert new permissions
    if (permissions && permissions.length > 0) {
      for (const permId of permissions) {
        await db.execute('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [id, permId]);
      }
    }

    res.json({ message: 'Permissões atualizadas com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar permissões', error: error.message });
  }
};
