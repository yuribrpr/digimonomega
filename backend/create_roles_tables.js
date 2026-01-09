const db = require('./config/db');

async function createRolesTables() {
  try {
    console.log('Creating roles tables...');

    // 1. Create roles table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table roles created/verified.');

    // 2. Create permissions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        permission_key VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description TEXT
      )
    `);
    console.log('Table permissions created/verified.');

    // 3. Create role_permissions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      )
    `);
    console.log('Table role_permissions created/verified.');

    // 4. Seed Permissions
    const permissions = [
      { key: 'view_dashboard', name: 'Ver Dashboard', desc: 'Acesso à página inicial do admin' },
      { key: 'manage_users', name: 'Gerenciar Usuários', desc: 'Acesso à página de usuários e permissões' },
      { key: 'manage_news', name: 'Gerenciar Notícias', desc: 'Criar e editar notícias' },
      { key: 'manage_digidex', name: 'Gerenciar Digidex', desc: 'Editar dados dos Digimons' },
      { key: 'manage_enemydex', name: 'Gerenciar Enemydex', desc: 'Editar dados dos Inimigos' },
      { key: 'manage_maps', name: 'Gerenciar Mapas', desc: 'Editar mapas do jogo' },
      { key: 'manage_items', name: 'Gerenciar Itens', desc: 'Editar itens do jogo' },
      { key: 'manage_settings', name: 'Configurações do Jogo', desc: 'Ajustar configurações globais' },
    ];

    for (const p of permissions) {
      await db.execute(`
        INSERT IGNORE INTO permissions (permission_key, name, description)
        VALUES (?, ?, ?)
      `, [p.key, p.name, p.desc]);
    }
    console.log('Permissions seeded.');

    // 5. Seed Roles
    await db.execute(`
      INSERT IGNORE INTO roles (name, description) VALUES 
      ('admin', 'Administrador do Sistema'),
      ('user', 'Usuário Comum')
    `);
    console.log('Roles seeded.');

    // 6. Assign all permissions to admin
    const [adminRole] = await db.execute("SELECT id FROM roles WHERE name = 'admin'");
    const adminRoleId = adminRole[0].id;

    const [allPermissions] = await db.execute("SELECT id FROM permissions");
    
    for (const p of allPermissions) {
      await db.execute(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
      `, [adminRoleId, p.id]);
    }
    console.log('Admin permissions assigned.');

    // 7. Update Users
    // Set everyone to 'user' first
    await db.execute("UPDATE users SET role = 'user' WHERE username != 'clovis'");
    // Set clovis to 'admin'
    await db.execute("UPDATE users SET role = 'admin' WHERE username = 'clovis'");
    console.log('User roles updated (Clovis is Admin, others are User).');

  } catch (error) {
    console.error('Error creating roles tables:', error);
  } finally {
    process.exit();
  }
}

createRolesTables();
