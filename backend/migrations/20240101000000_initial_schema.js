exports.up = async function(knex) {
  // Ordem de criação respeitando dependências (FKs)
  
  // 1. Tabelas Base (sem FKs ou dependências circulares simples)
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`users\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`username\` varchar(50) NOT NULL,
      \`email\` varchar(100) NOT NULL,
      \`password\` varchar(255) NOT NULL,
      \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      \`bits\` int DEFAULT '0',
      \`role\` enum('user','admin') DEFAULT 'user',
      \`level\` int DEFAULT '1',
      \`profile_image\` varchar(255) DEFAULT NULL,
      \`exp\` int DEFAULT '0',
      \`exp_m\` int DEFAULT '1000',
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`username\` (\`username\`),
      UNIQUE KEY \`email\` (\`email\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`items\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(100) NOT NULL,
      \`type\` enum('consumable','equipment','material','quest') NOT NULL,
      \`effect_value\` int DEFAULT NULL,
      \`price\` int DEFAULT '0',
      \`description\` text,
      \`image\` varchar(255) DEFAULT NULL,
      \`effect_target\` enum('hp','mp','revive','capture','none') DEFAULT 'none',
      \`is_percent\` tinyint(1) DEFAULT '0',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`digidex\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(100) NOT NULL,
      \`type\` varchar(50) NOT NULL,
      \`base_hp\` int NOT NULL,
      \`base_attack\` int NOT NULL,
      \`base_defense\` int NOT NULL,
      \`image\` varchar(255) DEFAULT NULL,
      \`description\` text,
      \`evolution_level\` int DEFAULT '1',
      \`evolution_id\` int DEFAULT NULL,
      \`required_level\` int DEFAULT NULL,
      \`required_item_id\` int DEFAULT '12',
      \`required_item_quantity\` int DEFAULT '0',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`enemydex\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(100) NOT NULL,
      \`type\` varchar(50) DEFAULT NULL,
      \`base_hp\` int DEFAULT '100',
      \`base_attack\` int DEFAULT '10',
      \`base_defense\` int DEFAULT '5',
      \`exp_reward\` int DEFAULT '10',
      \`bits_reward\` int DEFAULT '5',
      \`image\` varchar(255) DEFAULT NULL,
      \`difficulty\` varchar(20) DEFAULT 'Easy',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`game_settings\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`setting_key\` varchar(100) NOT NULL,
      \`setting_value\` text,
      \`description\` text,
      \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`setting_key\` (\`setting_key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`maps\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(100) NOT NULL,
      \`min_level\` int DEFAULT '1',
      \`image_path\` varchar(255) DEFAULT NULL,
      \`description\` text,
      \`created_at\` datetime DEFAULT CURRENT_TIMESTAMP,
      \`require_item\` tinyint(1) DEFAULT '0',
      \`required_item_id\` int DEFAULT NULL,
      \`consume_on_enter\` tinyint(1) DEFAULT '0',
      \`type\` varchar(50) DEFAULT 'Campanha',
      \`is_active\` tinyint(1) DEFAULT '1',
      \`difficulty\` float DEFAULT '1',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`news\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`title\` varchar(255) NOT NULL,
      \`content\` longtext,
      \`type\` enum('news','event') DEFAULT 'news',
      \`publisher\` varchar(255) DEFAULT NULL,
      \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      \`is_pinned\` tinyint(1) DEFAULT '0',
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`permissions\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`permission_key\` varchar(50) NOT NULL,
      \`name\` varchar(100) NOT NULL,
      \`description\` text,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`permission_key\` (\`permission_key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`roles\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(50) NOT NULL,
      \`description\` text,
      \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`name\` (\`name\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  // 2. Tabelas Dependentes
  
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`battles\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`enemy_id\` int NOT NULL,
      \`status\` enum('active','won','lost','fled') DEFAULT 'active',
      \`current_hp\` int DEFAULT NULL,
      \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      \`user_current_hp\` int DEFAULT NULL,
      \`user_max_hp\` int DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`user_id\` (\`user_id\`),
      KEY \`enemy_id\` (\`enemy_id\`),
      CONSTRAINT \`battles_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
      CONSTRAINT \`battles_ibfk_2\` FOREIGN KEY (\`enemy_id\`) REFERENCES \`enemydex\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`chat_messages\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`sender_id\` int NOT NULL,
      \`content\` text NOT NULL,
      \`timestamp\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      \`receiver_id\` int DEFAULT NULL,
      \`is_read\` tinyint(1) DEFAULT '0',
      PRIMARY KEY (\`id\`),
      KEY \`sender_id\` (\`sender_id\`),
      KEY \`receiver_id\` (\`receiver_id\`),
      CONSTRAINT \`chat_messages_ibfk_1\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\` (\`id\`),
      CONSTRAINT \`chat_messages_ibfk_2\` FOREIGN KEY (\`receiver_id\`) REFERENCES \`users\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`enemy_drops\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`enemy_id\` int NOT NULL,
      \`item_id\` int NOT NULL,
      \`drop_rate\` decimal(5,2) NOT NULL DEFAULT '0.00',
      PRIMARY KEY (\`id\`),
      KEY \`enemy_id\` (\`enemy_id\`),
      KEY \`item_id\` (\`item_id\`),
      CONSTRAINT \`enemy_drops_ibfk_1\` FOREIGN KEY (\`enemy_id\`) REFERENCES \`enemydex\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`enemy_drops_ibfk_2\` FOREIGN KEY (\`item_id\`) REFERENCES \`items\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`inventory\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`item_id\` int NOT NULL,
      \`quantity\` int DEFAULT '1',
      PRIMARY KEY (\`id\`),
      KEY \`user_id\` (\`user_id\`),
      KEY \`item_id\` (\`item_id\`),
      CONSTRAINT \`inventory_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
      CONSTRAINT \`inventory_ibfk_2\` FOREIGN KEY (\`item_id\`) REFERENCES \`items\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`map_enemies\` (
      \`map_id\` int NOT NULL,
      \`enemy_id\` int NOT NULL,
      PRIMARY KEY (\`map_id\`,\`enemy_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`news_likes\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`news_id\` int NOT NULL,
      \`user_id\` int NOT NULL,
      \`is_like\` tinyint(1) NOT NULL,
      \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`unique_like\` (\`news_id\`,\`user_id\`),
      KEY \`user_id\` (\`user_id\`),
      CONSTRAINT \`news_likes_ibfk_1\` FOREIGN KEY (\`news_id\`) REFERENCES \`news\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`news_likes_ibfk_2\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`role_permissions\` (
      \`role_id\` int NOT NULL,
      \`permission_id\` int NOT NULL,
      PRIMARY KEY (\`role_id\`,\`permission_id\`),
      KEY \`permission_id\` (\`permission_id\`),
      CONSTRAINT \`role_permissions_ibfk_1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`role_permissions_ibfk_2\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`user_digimons\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`user_id\` int NOT NULL,
      \`digidex_id\` int NOT NULL,
      \`nickname\` varchar(100) DEFAULT NULL,
      \`level\` int DEFAULT '1',
      \`current_exp\` int DEFAULT '0',
      \`max_exp\` int DEFAULT '100',
      \`current_hp\` int NOT NULL,
      \`max_hp\` int NOT NULL,
      \`attack\` int NOT NULL,
      \`defense\` int NOT NULL,
      \`extra_hp\` int DEFAULT '0',
      \`extra_attack\` int DEFAULT '0',
      \`extra_defense\` int DEFAULT '0',
      \`created_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      \`custom_name\` varchar(100) DEFAULT NULL,
      \`is_main\` tinyint(1) DEFAULT '0',
      \`exp\` int DEFAULT '0',
      \`unlocked_evolutions\` text,
      PRIMARY KEY (\`id\`),
      KEY \`user_id\` (\`user_id\`),
      KEY \`digidex_id\` (\`digidex_id\`),
      CONSTRAINT \`user_digimons_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
      CONSTRAINT \`user_digimons_ibfk_2\` FOREIGN KEY (\`digidex_id\`) REFERENCES \`digidex\` (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);
};

exports.down = async function(knex) {
  // Drop reverso
  await knex.raw('DROP TABLE IF EXISTS `user_digimons`');
  await knex.raw('DROP TABLE IF EXISTS `role_permissions`');
  await knex.raw('DROP TABLE IF EXISTS `news_likes`');
  await knex.raw('DROP TABLE IF EXISTS `map_enemies`');
  await knex.raw('DROP TABLE IF EXISTS `inventory`');
  await knex.raw('DROP TABLE IF EXISTS `enemy_drops`');
  await knex.raw('DROP TABLE IF EXISTS `chat_messages`');
  await knex.raw('DROP TABLE IF EXISTS `battles`');
  
  await knex.raw('DROP TABLE IF EXISTS `roles`');
  await knex.raw('DROP TABLE IF EXISTS `permissions`');
  await knex.raw('DROP TABLE IF EXISTS `news`');
  await knex.raw('DROP TABLE IF EXISTS `maps`');
  await knex.raw('DROP TABLE IF EXISTS `game_settings`');
  await knex.raw('DROP TABLE IF EXISTS `enemydex`');
  await knex.raw('DROP TABLE IF EXISTS `digidex`');
  await knex.raw('DROP TABLE IF EXISTS `items`');
  await knex.raw('DROP TABLE IF EXISTS `users`');
};
