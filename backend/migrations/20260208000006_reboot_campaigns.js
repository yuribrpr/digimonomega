
exports.up = async function(knex) {
  // Helper to insert and get ID
  const insertOne = async (table, data) => {
    const [id] = await knex(table).insert(data);
    return id;
  };

  // --- 1. REBOOT: WIPE & RECREATE SCHEMA ---
  // Disable foreign key checks to allow dropping tables
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  
  // Drop tables to ensure clean slate and correct schema
  // Order matters: Drop dependent tables first
  const tablesToDrop = [
    'battles', // Depends on enemydex
    'quest_rewards', 'quest_objectives', 'quest_dependencies', 'quests', 'campaigns',
    'map_enemies', 'enemy_drops', 'enemydex', 'items', 'maps', 
    'inventory', 'market_listings' 
    // user_digimons depends on digidex, usually safe. If it depends on items (equipped?), might need drop.
    // Let's assume user_digimons is safe for now, or we'd wipe user progress completely.
    // If we want a FULL reboot including user progress, we should drop inventory/battles/user_digimons.
    // Given the request "Excluir todos os dados atuais", dropping user progress seems consistent with a "campaign reboot".
    // But keeping user accounts (users table) is polite.
  ];
  
  for (const table of tablesToDrop) {
    await knex.schema.dropTableIfExists(table);
  }

  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // --- CREATE TABLES ---

  // ITEMS
  await knex.schema.createTable('items', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.enum('type', ['consumable', 'equipment', 'material', 'quest']).notNullable();
    table.integer('effect_value').defaultTo(0);
    table.integer('price').defaultTo(0);
    table.text('description');
    table.string('image', 255); 
    table.enum('effect_target', ['hp', 'mp', 'revive', 'capture', 'attack', 'defense', 'none']).defaultTo('none');
    table.boolean('is_percent').defaultTo(false);
    table.enum('recovery_type', ['current', 'max']).defaultTo('current');
  });

  // ENEMYDEX
  await knex.schema.createTable('enemydex', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('type', 50);
    table.string('stage', 50).defaultTo('Rookie');
    table.integer('base_hp').defaultTo(100);
    table.integer('base_attack').defaultTo(10);
    table.integer('base_defense').defaultTo(5);
    table.integer('base_level').defaultTo(1);
    table.float('attack_speed').defaultTo(2.0); // Seconds
    table.integer('exp_reward').defaultTo(10);
    table.integer('bits_reward').defaultTo(5);
    table.string('image', 255);
    table.string('difficulty', 20).defaultTo('Normal');
  });

  // MAPS
  await knex.schema.createTable('maps', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.integer('min_level').defaultTo(1);
    table.string('image_path', 255);
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.boolean('require_item').defaultTo(false);
    table.integer('required_item_id').nullable();
    table.boolean('consume_on_enter').defaultTo(false);
    table.string('type', 50).defaultTo('Campanha');
    table.boolean('is_active').defaultTo(true);
    table.float('difficulty').defaultTo(1.0);
  });

  // CAMPAIGNS
  await knex.schema.createTable('campaigns', table => {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description');
    table.integer('order').defaultTo(1);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // QUESTS
  await knex.schema.createTable('quests', table => {
    table.increments('id').primary();
    table.integer('campaign_id').unsigned().references('id').inTable('campaigns').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description');
    table.integer('order').defaultTo(1);
    table.integer('min_level').defaultTo(1);
    table.boolean('is_repeatable').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // QUEST OBJECTIVES
  await knex.schema.createTable('quest_objectives', table => {
    table.increments('id').primary();
    table.integer('quest_id').unsigned().references('id').inTable('quests').onDelete('CASCADE');
    table.enum('type', ['KILL_ENEMY', 'COLLECT_ITEM', 'TALK_NPC']).notNullable();
    table.integer('target_enemy_id').unsigned().nullable(); 
    table.integer('target_item_id').unsigned().nullable();
    table.integer('quantity_required').defaultTo(1);
  });

  // QUEST REWARDS
  await knex.schema.createTable('quest_rewards', table => {
    table.increments('id').primary();
    table.integer('quest_id').unsigned().references('id').inTable('quests').onDelete('CASCADE');
    table.enum('type', ['XP', 'BITS', 'ITEM']).notNullable();
    table.integer('quantity').defaultTo(0);
    table.integer('item_id').unsigned().nullable();
  });

  // QUEST DEPENDENCIES
  await knex.schema.createTable('quest_dependencies', table => {
    table.increments('id').primary();
    table.integer('quest_id').unsigned().references('id').inTable('quests').onDelete('CASCADE');
    table.integer('depends_on_quest_id').unsigned().references('id').inTable('quests').onDelete('CASCADE');
    table.unique(['quest_id', 'depends_on_quest_id']);
  });

  // RELATIONS
  
  // Map Enemies
  await knex.schema.createTable('map_enemies', table => {
    table.integer('map_id').unsigned().references('id').inTable('maps').onDelete('CASCADE');
    table.integer('enemy_id').unsigned().references('id').inTable('enemydex').onDelete('CASCADE');
    table.primary(['map_id', 'enemy_id']);
  });

  // Enemy Drops
  await knex.schema.createTable('enemy_drops', table => {
    table.increments('id').primary();
    table.integer('enemy_id').unsigned().references('id').inTable('enemydex').onDelete('CASCADE');
    table.integer('item_id').unsigned().references('id').inTable('items').onDelete('CASCADE');
    table.decimal('drop_rate', 5, 2).defaultTo(0.00);
  });

  // Inventory (Recreate)
  await knex.schema.createTable('inventory', table => {
    table.increments('id').primary();
    table.integer('user_id').notNullable(); 
    table.integer('item_id').unsigned().references('id').inTable('items').onDelete('CASCADE');
    table.integer('quantity').defaultTo(1);
  });
  
  // Market Listings (Recreate)
  await knex.schema.createTable('market_listings', table => {
      table.increments('id').primary();
      table.integer('seller_id').notNullable();
      table.enum('listing_type', ['item', 'digimon']).notNullable();
      table.integer('item_id').unsigned().nullable().references('id').inTable('items').onDelete('CASCADE');
      table.integer('digimon_id').nullable();
      table.integer('quantity').defaultTo(1);
      table.integer('price').notNullable();
      table.enum('status', ['active', 'sold', 'cancelled']).defaultTo('active');
      table.integer('buyer_id').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('sold_at').nullable();
  });
  
  // BATTLES (Recreate to fix missing table)
  await knex.schema.createTable('battles', table => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.integer('enemy_id').unsigned().references('id').inTable('enemydex').onDelete('CASCADE');
      table.string('status', 20).defaultTo('active'); // active, won, lost, fled
      table.integer('user_digimon_id').nullable();
      table.integer('current_hp').nullable();
      table.integer('enemy_current_hp').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
  });


  // --- 2. ASSETS & ICONS ---
  const icons = {
    // Potions
    potionSmall: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
    potionMed: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png',
    potionLarge: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hyper-potion.png',
    // Boosters
    atkBoost: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-attack.png',
    defBoost: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/x-defense.png',
    // Quest Items
    ticket: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/town-map.png',
    badge: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/coin-case.png',
    sheriffStar: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/star-piece.png',
    iceShard: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/never-melt-ice.png',
    oilDrum: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/black-sludge.png',
    scarab: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nugget.png',
    // Generic
    data: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/stardust.png'
  };

  // --- 3. ITEMS ---
  // Consumables
  const itemPotionS = await insertOne('items', { name: 'Poção Pequena', type: 'consumable', description: 'Recupera 50 HP.', effect_target: 'hp', effect_value: 50, recovery_type: 'current', image: icons.potionSmall, price: 50 });
  const itemPotionM = await insertOne('items', { name: 'Poção Média', type: 'consumable', description: 'Recupera 200 HP.', effect_target: 'hp', effect_value: 200, recovery_type: 'current', image: icons.potionMed, price: 150 });
  const itemPotionL = await insertOne('items', { name: 'Poção Grande', type: 'consumable', description: 'Recupera 1000 HP.', effect_target: 'hp', effect_value: 1000, recovery_type: 'current', image: icons.potionLarge, price: 500 });
  
  const itemAtkBoost = await insertOne('items', { name: 'X-Attack', type: 'consumable', description: 'Aumenta Ataque por 5 min.', effect_target: 'attack', effect_value: 10, is_percent: true, image: icons.atkBoost, price: 300 });
  const itemDefBoost = await insertOne('items', { name: 'X-Defense', type: 'consumable', description: 'Aumenta Defesa por 5 min.', effect_target: 'defense', effect_value: 10, is_percent: true, image: icons.defBoost, price: 300 });

  // Quest Items (Camp 1)
  const itemMetroTicket = await insertOne('items', { name: 'Bilhete de Metrô', type: 'quest', description: 'Bilhete antigo de Shibuya.', image: icons.ticket });
  const itemDataFrag = await insertOne('items', { name: 'Fragmento de Dados', type: 'quest', description: 'Pedaço de código corrompido.', image: icons.data });
  const itemOgremonClub = await insertOne('items', { name: 'Clava de Ogremon', type: 'quest', description: 'Arma pesada deixada para trás.', image: icons.badge });

  // Quest Items (Camp 2)
  const itemSheriffStar = await insertOne('items', { name: 'Estrela de Xerife', type: 'quest', description: 'Insígnia de Starmon.', image: icons.sheriffStar });
  const itemGunPowder = await insertOne('items', { name: 'Pólvora Digital', type: 'quest', description: 'Restos de Revolmon.', image: icons.data });

  // Quest Items (Camp 3)
  const itemIceCrystal = await insertOne('items', { name: 'Cristal de Gelo', type: 'quest', description: 'Nunca derrete.', image: icons.iceShard });
  const itemVikingShield = await insertOne('items', { name: 'Fragmento de Escudo', type: 'quest', description: 'Pedaço do escudo de Vikemon.', image: icons.badge });

  // Quest Items (Camp 4)
  const itemRefinedOil = await insertOne('items', { name: 'Óleo Refinado', type: 'quest', description: 'Combustível de alta pureza.', image: icons.oilDrum });
  const itemChromeDigizoid = await insertOne('items', { name: 'Chrome Digizoid', type: 'quest', description: 'Metal raríssimo.', image: icons.badge });

  // Quest Items (Camp 5)
  const itemGoldenScarab = await insertOne('items', { name: 'Escaravelho Dourado', type: 'quest', description: 'Relíquia antiga.', image: icons.scarab });
  const itemDarkCore = await insertOne('items', { name: 'Núcleo das Trevas', type: 'quest', description: 'Pulsa com energia maligna.', image: icons.data });

  // --- 4. ENEMIES & DROPS ---
  // Helper to create enemy
  const createEnemy = async (name, type, stage, hp, atk, def, lvl, speed, exp, bits, diff, img, drops = []) => {
    const id = await insertOne('enemydex', {
      name, type, stage, base_hp: hp, base_attack: atk, base_defense: def,
      base_level: lvl, attack_speed: speed, exp_reward: exp, bits_reward: bits,
      difficulty: diff, image: img || `/enemies/${name.toLowerCase().replace(/ /g, '_')}.png`
    });
    for (const d of drops) {
      await insertOne('enemy_drops', { enemy_id: id, item_id: d.id, drop_rate: d.rate });
    }
    return id;
  };

  // CAMP 1: JAPAN (Lvl 1-15) - 3 Rookie, 1 Boss Champ per map
  // Map 1: Shibuya
  const e1_1_1 = await createEnemy('Gazimon', 'Vírus', 'Rookie', 200, 20, 10, 2, 2.5, 15, 10, 'Easy', null, [{id: itemPotionS, rate: 10}]);
  const e1_1_2 = await createEnemy('DemiDevimon', 'Vírus', 'Rookie', 220, 25, 8, 3, 2.0, 18, 12, 'Easy', null, [{id: itemDataFrag, rate: 20}]);
  const e1_1_3 = await createEnemy('Hagurumon', 'Vírus', 'Rookie', 250, 18, 20, 4, 3.0, 20, 15, 'Normal', null, [{id: itemPotionS, rate: 15}]);
  const b1_1 = await createEnemy('Numemon', 'Vírus', 'Champion', 800, 60, 40, 5, 3.5, 100, 50, 'Boss', null, [{id: itemMetroTicket, rate: 100}]);

  // Map 2: Parque Yoyogi
  const e1_2_1 = await createEnemy('Mushroomon', 'Vírus', 'Rookie', 300, 35, 20, 6, 2.5, 25, 15, 'Normal', null, [{id: itemPotionS, rate: 20}]);
  const e1_2_2 = await createEnemy('Floramon', 'Data', 'Rookie', 280, 30, 25, 7, 2.0, 28, 18, 'Normal', null, [{id: itemDataFrag, rate: 20}]);
  const e1_2_3 = await createEnemy('Palmon', 'Data', 'Rookie', 320, 32, 22, 8, 2.2, 30, 20, 'Normal', null, [{id: itemPotionS, rate: 15}]);
  const b1_2 = await createEnemy('Kuwagamon', 'Vírus', 'Champion', 1200, 100, 50, 10, 2.8, 200, 100, 'Boss', null, [{id: itemPotionS, rate: 50}]);

  // Map 3: Torre de Tóquio
  const e1_3_1 = await createEnemy('Kokuwamon', 'Data', 'Rookie', 400, 45, 60, 11, 3.0, 40, 25, 'Hard', null, [{id: itemDefBoost, rate: 5}]);
  const e1_3_2 = await createEnemy('Betamon', 'Vírus', 'Rookie', 380, 50, 30, 12, 2.0, 45, 30, 'Hard', null, [{id: itemPotionM, rate: 5}]);
  const e1_3_3 = await createEnemy('Elecmon', 'Data', 'Rookie', 420, 55, 35, 13, 1.8, 50, 35, 'Hard', null, [{id: itemAtkBoost, rate: 5}]);
  const b1_3 = await createEnemy('Meramon', 'Data', 'Champion', 1800, 150, 80, 14, 2.5, 300, 150, 'Boss', null);

  // Map 4: Odaiba
  const e1_4_1 = await createEnemy('Gomamon', 'Vacina', 'Rookie', 500, 60, 50, 14, 2.5, 60, 40, 'Hard', null, [{id: itemPotionM, rate: 10}]);
  const e1_4_2 = await createEnemy('Crabmon', 'Data', 'Rookie', 550, 65, 80, 14, 3.0, 65, 45, 'Hard', null);
  const e1_4_3 = await createEnemy('Gizamon', 'Vírus', 'Rookie', 480, 70, 40, 14, 2.0, 70, 50, 'Hard', null);
  const b1_4 = await createEnemy('Ogremon', 'Vírus', 'Champion', 2500, 200, 100, 15, 2.5, 500, 300, 'Boss', null, [{id: itemOgremonClub, rate: 100}]);

  // CAMP 2: WESTERN (Lvl 15-30) - 3 Champ, 1 Boss Ult
  // Map 1: Cidade Fantasma
  const e2_1_1 = await createEnemy('Revolmon', 'Vacina', 'Champion', 1500, 150, 100, 16, 2.0, 150, 80, 'Normal', null, [{id: itemGunPowder, rate: 25}]);
  const e2_1_2 = await createEnemy('Igamon', 'Data', 'Champion', 1400, 160, 80, 17, 1.5, 160, 85, 'Normal', null);
  const e2_1_3 = await createEnemy('Starmon', 'Data', 'Champion', 1600, 170, 120, 18, 2.2, 170, 90, 'Normal', null, [{id: itemSheriffStar, rate: 10}]);
  const b2_1 = await createEnemy('SuperStarmon', 'Data', 'Ultimate', 5000, 400, 300, 20, 2.0, 800, 400, 'Boss', null);

  // Map 2: Canyon
  const e2_2_1 = await createEnemy('Centarumon', 'Data', 'Champion', 1800, 180, 150, 21, 2.0, 180, 100, 'Normal', null);
  const e2_2_2 = await createEnemy('Monochromon', 'Data', 'Champion', 2200, 190, 200, 22, 3.0, 190, 110, 'Normal', null);
  const e2_2_3 = await createEnemy('Tyrannomon', 'Data', 'Champion', 2000, 200, 140, 23, 2.5, 200, 120, 'Normal', null);
  const b2_2 = await createEnemy('Triceramon', 'Data', 'Ultimate', 6000, 500, 500, 25, 3.0, 1000, 500, 'Boss', null);

  // Map 3: Minas
  const e2_3_1 = await createEnemy('Drimogemon', 'Data', 'Champion', 2400, 210, 180, 26, 2.5, 220, 130, 'Normal', null);
  const e2_3_2 = await createEnemy('Nanimon', 'Vírus', 'Champion', 2300, 200, 190, 27, 2.0, 230, 140, 'Normal', null);
  const e2_3_3 = await createEnemy('Gekomon', 'Data', 'Champion', 2100, 190, 160, 27, 2.2, 210, 125, 'Normal', null);
  const b2_3 = await createEnemy('Etemon', 'Vírus', 'Ultimate', 7000, 600, 400, 28, 2.0, 1200, 600, 'Boss', null);

  // Map 4: Forte de Ferro
  const e2_4_1 = await createEnemy('Tankmon', 'Data', 'Champion', 3000, 250, 300, 29, 3.5, 250, 150, 'Hard', null, [{id: itemRefinedOil, rate: 10}]);
  const e2_4_2 = await createEnemy('Guardromon', 'Vírus', 'Champion', 2800, 240, 280, 29, 3.0, 240, 145, 'Hard', null);
  const e2_4_3 = await createEnemy('Mekanorimon', 'Vírus', 'Champion', 3200, 230, 320, 29, 4.0, 230, 140, 'Hard', null);
  const b2_4 = await createEnemy('Andromon', 'Vacina', 'Ultimate', 8500, 700, 600, 30, 2.5, 1500, 800, 'Boss', null, [{id: itemChromeDigizoid, rate: 50}]);

  // CAMP 3: ICELAND (Lvl 30-45) - 3 Ult, 1 Boss Mega
  // Map 1: Campos de Neve
  const e3_1_1 = await createEnemy('Panjyamon', 'Vacina', 'Ultimate', 4000, 300, 250, 32, 2.0, 400, 200, 'Normal', null, [{id: itemIceCrystal, rate: 25}]);
  const e3_1_2 = await createEnemy('Mammothmon', 'Vacina', 'Ultimate', 5000, 350, 300, 33, 3.5, 450, 220, 'Normal', null);
  const e3_1_3 = await createEnemy('Whamon', 'Vacina', 'Ultimate', 6000, 320, 400, 34, 4.0, 500, 250, 'Normal', null);
  const b3_1 = await createEnemy('Vikemon', 'Vacina', 'Mega', 15000, 1000, 800, 35, 2.5, 2500, 1000, 'Boss', null, [{id: itemVikingShield, rate: 100}]);

  // Map 2: Caverna
  const e3_2_1 = await createEnemy('Zudomon', 'Vacina', 'Ultimate', 5500, 400, 450, 36, 2.8, 550, 280, 'Hard', null);
  const e3_2_2 = await createEnemy('BlueMeramon', 'Data', 'Ultimate', 4500, 500, 200, 37, 1.8, 580, 300, 'Hard', null);
  const e3_2_3 = await createEnemy('WereGarurumon', 'Vacina', 'Ultimate', 4800, 480, 300, 38, 1.5, 600, 320, 'Hard', null);
  const b3_2 = await createEnemy('MetalGarurumon', 'Data', 'Mega', 18000, 1200, 700, 40, 1.5, 3000, 1500, 'Boss', null);

  // Map 3: Pico
  const e3_3_1 = await createEnemy('MarineDevimon', 'Vírus', 'Ultimate', 5200, 450, 350, 41, 2.2, 620, 330, 'Hard', null);
  const e3_3_2 = await createEnemy('Dragomon', 'Vírus', 'Ultimate', 5800, 480, 400, 42, 2.5, 650, 350, 'Hard', null);
  const e3_3_3 = await createEnemy('ShogunGekomon', 'Data', 'Ultimate', 6500, 420, 500, 42, 3.0, 680, 360, 'Hard', null);
  const b3_3 = await createEnemy('Plesiomon', 'Data', 'Mega', 20000, 1300, 900, 43, 2.0, 3500, 1800, 'Boss', null);

  // Map 4: Templo
  const e3_4_1 = await createEnemy('MegaSeadramon', 'Data', 'Ultimate', 6000, 550, 400, 44, 2.0, 700, 380, 'Hard', null);
  const e3_4_2 = await createEnemy('WaruSeadramon', 'Vírus', 'Ultimate', 6200, 580, 380, 44, 2.0, 720, 400, 'Hard', null);
  const e3_4_3 = await createEnemy('Scorpiomon', 'Data', 'Ultimate', 6800, 600, 600, 45, 2.8, 750, 420, 'Hard', null);
  const b3_4 = await createEnemy('MetalSeadramon', 'Data', 'Mega', 25000, 1500, 1200, 45, 1.8, 5000, 2500, 'Boss', null);

  // CAMP 4: REFINERY (Lvl 45-60) - 3 Mega, 1 Boss Mega
  // Map 1: Tubulações
  const e4_1_1 = await createEnemy('HiAndromon', 'Vacina', 'Mega', 10000, 800, 800, 48, 2.0, 1000, 500, 'Normal', null);
  const e4_1_2 = await createEnemy('Boltmon', 'Data', 'Mega', 12000, 900, 600, 49, 2.5, 1100, 550, 'Normal', null);
  const e4_1_3 = await createEnemy('PrinceMamemon', 'Data', 'Mega', 9000, 850, 700, 50, 1.5, 1200, 600, 'Normal', null);
  const b4_1 = await createEnemy('RustTyranomon', 'Vírus', 'Mega', 30000, 1800, 1500, 52, 2.8, 6000, 3000, 'Boss', null, [{id: itemRefinedOil, rate: 80}]);

  // Map 2: Reator
  const e4_2_1 = await createEnemy('Ebemon', 'Vírus', 'Mega', 11000, 950, 650, 53, 1.8, 1300, 650, 'Hard', null);
  const e4_2_2 = await createEnemy('Justimon', 'Vacina', 'Mega', 12500, 1000, 850, 54, 1.8, 1400, 700, 'Hard', null);
  const e4_2_3 = await createEnemy('Raidenmon', 'Vírus', 'Mega', 14000, 1100, 900, 55, 2.2, 1500, 750, 'Hard', null);
  const b4_2 = await createEnemy('Chaosdramon', 'Vírus', 'Mega', 35000, 2000, 1800, 56, 2.0, 7000, 3500, 'Boss', null);

  // Map 3: Depósito
  const e4_3_1 = await createEnemy('Puppetmon', 'Vírus', 'Mega', 13000, 1200, 700, 57, 2.0, 1600, 800, 'Hard', null);
  const e4_3_2 = await createEnemy('Piedmon', 'Vírus', 'Mega', 13500, 1300, 600, 57, 1.5, 1700, 850, 'Hard', null);
  const e4_3_3 = await createEnemy('MetalEtemon', 'Vírus', 'Mega', 14500, 1100, 1200, 58, 2.0, 1800, 900, 'Hard', null);
  const b4_3 = await createEnemy('VenomMyotismon', 'Vírus', 'Mega', 40000, 2200, 1500, 59, 2.5, 8000, 4000, 'Boss', null);

  // Map 4: Torre
  const e4_4_1 = await createEnemy('Diaboromon', 'Unidentified', 'Mega', 15000, 1500, 500, 59, 1.0, 2000, 1000, 'Hard', null);
  const e4_4_2 = await createEnemy('BlackWarGreymon', 'Vírus', 'Mega', 16000, 1600, 1000, 59, 1.8, 2100, 1050, 'Hard', null);
  const e4_4_3 = await createEnemy('Machinedramon', 'Vírus', 'Mega', 18000, 1400, 1400, 59, 2.5, 2200, 1100, 'Hard', null);
  const b4_4 = await createEnemy('Millenniummon', 'Vírus', 'Mega', 50000, 2500, 2000, 60, 2.0, 10000, 5000, 'Boss', null);

  // CAMP 5: DESERT (Lvl 60-80)
  // Map 1: Dunas
  const e5_1_1 = await createEnemy('Pharaohmon', 'Vírus', 'Mega', 20000, 1800, 1500, 62, 2.0, 2500, 1200, 'Hard', null, [{id: itemGoldenScarab, rate: 20}]);
  const e5_1_2 = await createEnemy('Anubismon', 'Vacina', 'Mega', 21000, 1900, 1400, 63, 1.8, 2600, 1300, 'Hard', null);
  const e5_1_3 = await createEnemy('Daemon', 'Vírus', 'Mega', 22000, 2000, 1600, 64, 2.0, 2700, 1350, 'Hard', null);
  const b5_1 = await createEnemy('Barbamon', 'Vírus', 'Mega', 60000, 3000, 2500, 65, 2.2, 12000, 6000, 'Boss', null);

  // Map 2: Oásis
  const e5_2_1 = await createEnemy('Lilithmon', 'Vírus', 'Mega', 23000, 2200, 1200, 66, 1.5, 2800, 1400, 'Hard', null);
  const e5_2_2 = await createEnemy('Beelzemon', 'Vírus', 'Mega', 24000, 2300, 1300, 67, 1.2, 2900, 1450, 'Hard', null);
  const e5_2_3 = await createEnemy('Leviamon', 'Vírus', 'Mega', 28000, 2100, 2000, 68, 2.5, 3000, 1500, 'Hard', null);
  const b5_2 = await createEnemy('Belphemon', 'Vírus', 'Mega', 70000, 3500, 2800, 70, 2.0, 14000, 7000, 'Boss', null);

  // Map 3: Pirâmide
  const e5_3_1 = await createEnemy('Dynasmon', 'Data', 'Mega', 30000, 2500, 2000, 72, 1.8, 3200, 1600, 'Hard', null);
  const e5_3_2 = await createEnemy('LordKnightmon', 'Vírus', 'Mega', 31000, 2400, 2100, 73, 1.6, 3300, 1650, 'Hard', null);
  const e5_3_3 = await createEnemy('Lucemon FM', 'Vírus', 'Mega', 35000, 3000, 1800, 74, 1.5, 3500, 1750, 'Hard', null);
  const b5_3 = await createEnemy('Lucemon SM', 'Vírus', 'Mega', 80000, 4000, 3000, 75, 2.5, 16000, 8000, 'Boss', null);

  // Map 4: Câmara
  const e5_4_1 = await createEnemy('Alphamon', 'Vacina', 'Mega', 40000, 3500, 3000, 78, 1.8, 4000, 2000, 'Hard', null);
  const e5_4_2 = await createEnemy('Examon', 'Data', 'Mega', 50000, 3800, 3500, 79, 2.5, 4200, 2100, 'Hard', null);
  const e5_4_3 = await createEnemy('Omegamon', 'Vacina', 'Mega', 45000, 3600, 3200, 79, 1.5, 4100, 2050, 'Hard', null);
  const b5_4 = await createEnemy('Ogudomon', 'Vírus', 'Mega', 99999, 5000, 5000, 80, 2.0, 20000, 10000, 'Boss', null, [{id: itemDarkCore, rate: 100}]);

  // --- 5. MAPS ---
  const createMap = async (name, minLvl, diff, img, type, enemies) => {
    const id = await insertOne('maps', {
      name, min_level: minLvl, difficulty: diff, image_path: img, type, is_active: true
    });
    for (const eid of enemies) {
      await knex('map_enemies').insert({ map_id: id, enemy_id: eid });
    }
    return id;
  };

  // Camp 1 Maps
  const m1_1 = await createMap('Subúrbio de Shibuya', 1, 1.0, '/maps/shibuya.png', 'Campanha', [e1_1_1, e1_1_2, e1_1_3, b1_1]);
  const m1_2 = await createMap('Parque Yoyogi', 5, 1.2, '/maps/yoyogi.png', 'Campanha', [e1_2_1, e1_2_2, e1_2_3, b1_2]);
  const m1_3 = await createMap('Torre de Tóquio', 10, 1.5, '/maps/tokyo_tower.png', 'Campanha', [e1_3_1, e1_3_2, e1_3_3, b1_3]);
  const m1_4 = await createMap('Odaiba', 12, 1.8, '/maps/odaiba.png', 'Campanha', [e1_4_1, e1_4_2, e1_4_3, b1_4]);

  // Camp 2 Maps
  const m2_1 = await createMap('Cidade Fantasma', 15, 2.0, '/maps/ghost_town.png', 'Campanha', [e2_1_1, e2_1_2, e2_1_3, b2_1]);
  const m2_2 = await createMap('Canyon de Poeira', 20, 2.2, '/maps/canyon.png', 'Campanha', [e2_2_1, e2_2_2, e2_2_3, b2_2]);
  const m2_3 = await createMap('Minas Abandonadas', 25, 2.5, '/maps/mines.png', 'Campanha', [e2_3_1, e2_3_2, e2_3_3, b2_3]);
  const m2_4 = await createMap('Forte de Ferro', 28, 2.8, '/maps/iron_fort.png', 'Campanha', [e2_4_1, e2_4_2, e2_4_3, b2_4]);

  // Camp 3 Maps
  const m3_1 = await createMap('Campos de Neve', 30, 3.0, '/maps/snow_fields.png', 'Campanha', [e3_1_1, e3_1_2, e3_1_3, b3_1]);
  const m3_2 = await createMap('Caverna de Cristal', 35, 3.2, '/maps/crystal_cave.png', 'Campanha', [e3_2_1, e3_2_2, e3_2_3, b3_2]);
  const m3_3 = await createMap('Pico Congelado', 40, 3.5, '/maps/frozen_peak.png', 'Campanha', [e3_3_1, e3_3_2, e3_3_3, b3_3]);
  const m3_4 = await createMap('Templo de Gelo', 42, 3.8, '/maps/ice_temple.png', 'Campanha', [e3_4_1, e3_4_2, e3_4_3, b3_4]);

  // Camp 4 Maps
  const m4_1 = await createMap('Setor de Tubulações', 45, 4.0, '/maps/pipes.png', 'Campanha', [e4_1_1, e4_1_2, e4_1_3, b4_1]);
  const m4_2 = await createMap('Reator Central', 50, 4.2, '/maps/reactor.png', 'Campanha', [e4_2_1, e4_2_2, e4_2_3, b4_2]);
  const m4_3 = await createMap('Depósito de Resíduos', 55, 4.5, '/maps/waste.png', 'Campanha', [e4_3_1, e4_3_2, e4_3_3, b4_3]);
  const m4_4 = await createMap('Torre de Controle', 58, 4.8, '/maps/control_tower.png', 'Campanha', [e4_4_1, e4_4_2, e4_4_3, b4_4]);

  // Camp 5 Maps
  const m5_1 = await createMap('Dunas Infinitas', 60, 5.0, '/maps/dunes.png', 'Campanha', [e5_1_1, e5_1_2, e5_1_3, b5_1]);
  const m5_2 = await createMap('Oásis Amaldiçoado', 65, 5.5, '/maps/cursed_oasis.png', 'Campanha', [e5_2_1, e5_2_2, e5_2_3, b5_2]);
  const m5_3 = await createMap('Pirâmide Invertida', 70, 6.0, '/maps/pyramid.png', 'Campanha', [e5_3_1, e5_3_2, e5_3_3, b5_3]);
  const m5_4 = await createMap('Câmara do Faraó', 75, 7.0, '/maps/chamber.png', 'Campanha', [e5_4_1, e5_4_2, e5_4_3, b5_4]);

  // --- 6. CAMPAIGNS & QUESTS ---
  // Helper for quests
  const createQuest = async (campId, title, desc, order, minLvl, objs = [], rewards = [], deps = [], isRepeat = false) => {
    const qId = await insertOne('quests', { campaign_id: campId, title, description: desc, order, min_level: minLvl, is_repeatable: isRepeat });
    for (const o of objs) await insertOne('quest_objectives', { ...o, quest_id: qId });
    for (const r of rewards) await insertOne('quest_rewards', { ...r, quest_id: qId });
    for (const d of deps) await insertOne('quest_dependencies', { quest_id: qId, depends_on_quest_id: d });
    return qId;
  };

  // Campaign 1
  const c1 = await insertOne('campaigns', { title: 'Tóquio Digital', description: 'Estranhos fenômenos em Tóquio.', order: 1, is_active: true });
  
  const q1_1 = await createQuest(c1, 'Caos em Shibuya', 'Gazimons estão assustando as pessoas no cruzamento. Impeça-os.', 1, 1, 
    [{ type: 'KILL_ENEMY', target_enemy_id: e1_1_1, quantity_required: 3 }], 
    [{ type: 'XP', quantity: 50 }, { type: 'BITS', quantity: 50 }]);
  
  const q1_2 = await createQuest(c1, 'Primeiros Socorros', 'Colete Poções de Hagurumons para os feridos.', 2, 2, 
    [{ type: 'COLLECT_ITEM', target_item_id: itemPotionS, quantity_required: 3 }], 
    [{ type: 'ITEM', item_id: itemPotionS, quantity: 5 }], [q1_1]);

  const q1_3 = await createQuest(c1, 'O Chefe do Bairro', 'Numemon está bloqueando o metrô. Derrote-o.', 3, 5, 
    [{ type: 'KILL_ENEMY', target_enemy_id: b1_1, quantity_required: 1 }], 
    [{ type: 'ITEM', item_id: itemMetroTicket, quantity: 1 }, { type: 'XP', quantity: 200 }], [q1_2]);

  const q1_4 = await createQuest(c1, 'Investigação no Parque', 'Use o metrô para ir a Yoyogi. Derrote Mushroomons agressivos.', 4, 6, 
    [{ type: 'KILL_ENEMY', target_enemy_id: e1_2_1, quantity_required: 5 }], 
    [{ type: 'BITS', quantity: 200 }], [q1_3]);

  const q1_5 = await createQuest(c1, 'Ameaça Inseto', 'Kuwagamon apareceu no parque!', 5, 8,
    [{ type: 'KILL_ENEMY', target_enemy_id: b1_2, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemPotionM, quantity: 2 }], [q1_4]);

  const q1_6 = await createQuest(c1, 'Torre em Chamas', 'Meramon está superaquecendo a Torre de Tóquio.', 6, 10,
    [{ type: 'KILL_ENEMY', target_enemy_id: b1_3, quantity_required: 1 }],
    [{ type: 'XP', quantity: 500 }], [q1_5]);

  const q1_7 = await createQuest(c1, 'Batalha Final em Odaiba', 'Ogremon sequestrou um ônibus em Odaiba.', 7, 12,
    [{ type: 'KILL_ENEMY', target_enemy_id: b1_4, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemOgremonClub, quantity: 1 }], [q1_6]);

  // Repeatable Quests Camp 1
  await createQuest(c1, 'Patrulha Diária', 'Derrote 5 Gazimons para manter as ruas seguras.', 8, 3, 
    [{ type: 'KILL_ENEMY', target_enemy_id: e1_1_1, quantity_required: 5 }], 
    [{ type: 'ITEM', item_id: itemPotionS, quantity: 2 }], [], true);

  // Campaign 2
  const c2 = await insertOne('campaigns', { title: 'O Velho Oeste', description: 'Um servidor esquecido onde a lei é a força.', order: 2, is_active: true });
  
  const q2_1 = await createQuest(c2, 'Duelo ao Meio-Dia', 'Derrote 3 Revolmons que desafiam viajantes.', 1, 15,
    [{ type: 'KILL_ENEMY', target_enemy_id: e2_1_1, quantity_required: 3 }],
    [{ type: 'XP', quantity: 300 }]);

  const q2_2 = await createQuest(c2, 'Estrela da Lei', 'Recupere Estrelas de Xerife de Starmons.', 2, 16,
    [{ type: 'COLLECT_ITEM', target_item_id: itemSheriffStar, quantity_required: 3 }],
    [{ type: 'BITS', quantity: 500 }], [q2_1]);

  const q2_3 = await createQuest(c2, 'O Xerife Corrupto', 'SuperStarmon tomou controle da cidade.', 3, 18,
    [{ type: 'KILL_ENEMY', target_enemy_id: b2_1, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemAtkBoost, quantity: 2 }], [q2_2]);

  const q2_4 = await createQuest(c2, 'Corrida no Canyon', 'Centarumons estão bloqueando a passagem.', 4, 20,
    [{ type: 'KILL_ENEMY', target_enemy_id: e2_2_1, quantity_required: 5 }],
    [{ type: 'XP', quantity: 400 }], [q2_3]);

  const q2_5 = await createQuest(c2, 'O Rei do Rock', 'Etemon está fazendo um show ensurdecedor nas minas.', 5, 25,
    [{ type: 'KILL_ENEMY', target_enemy_id: b2_3, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemDefBoost, quantity: 2 }], [q2_4]);

  const q2_6 = await createQuest(c2, 'Revolução das Máquinas', 'Andromon está construindo um exército.', 6, 28,
    [{ type: 'KILL_ENEMY', target_enemy_id: b2_4, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemChromeDigizoid, quantity: 1 }], [q2_5]);

  // Repeatable Camp 2
  await createQuest(c2, 'Caça aos Bandidos', 'Derrote 5 Igamons.', 7, 18,
    [{ type: 'KILL_ENEMY', target_enemy_id: e2_1_2, quantity_required: 5 }],
    [{ type: 'ITEM', item_id: itemPotionM, quantity: 3 }], [], true);

  // Campaign 3
  const c3 = await insertOne('campaigns', { title: 'Fronteira Gelada', description: 'Onde o frio congela até os dados.', order: 3, is_active: true });

  const q3_1 = await createQuest(c3, 'Guerreiros do Gelo', 'Derrote Panjyamons para provar sua força.', 1, 30,
    [{ type: 'KILL_ENEMY', target_enemy_id: e3_1_1, quantity_required: 3 }],
    [{ type: 'XP', quantity: 800 }]);

  const q3_2 = await createQuest(c3, 'O Lorde Viking', 'Vikemon governa os campos de neve.', 2, 33,
    [{ type: 'KILL_ENEMY', target_enemy_id: b3_1, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemVikingShield, quantity: 1 }], [q3_1]);
  
  const q3_3 = await createQuest(c3, 'Cristais de Poder', 'Colete Cristais de Gelo de Panjyamons.', 3, 35,
    [{ type: 'COLLECT_ITEM', target_item_id: itemIceCrystal, quantity_required: 5 }],
    [{ type: 'BITS', quantity: 2000 }], [q3_2]);

  const q3_4 = await createQuest(c3, 'A Lenda do Lobo', 'MetalGarurumon guarda a caverna.', 4, 38,
    [{ type: 'KILL_ENEMY', target_enemy_id: b3_2, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemPotionL, quantity: 2 }], [q3_3]);

  const q3_5 = await createQuest(c3, 'Terror das Profundezas', 'MetalSeadramon ameaça destruir o templo.', 5, 42,
    [{ type: 'KILL_ENEMY', target_enemy_id: b3_4, quantity_required: 1 }],
    [{ type: 'XP', quantity: 5000 }], [q3_4]);

  // Campaign 4
  const c4 = await insertOne('campaigns', { title: 'Refinaria Obscura', description: 'Poluição e trevas se misturam.', order: 4, is_active: true });

  const q4_1 = await createQuest(c4, 'Vazamento de Dados', 'HiAndromons estão fora de controle.', 1, 45,
    [{ type: 'KILL_ENEMY', target_enemy_id: e4_1_1, quantity_required: 5 }],
    [{ type: 'XP', quantity: 2000 }]);

  const q4_2 = await createQuest(c4, 'O Tirano Ferrugem', 'RustTyranomon consome tudo.', 2, 48,
    [{ type: 'KILL_ENEMY', target_enemy_id: b4_1, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemRefinedOil, quantity: 3 }], [q4_1]);

  const q4_3 = await createQuest(c4, 'Energia Caótica', 'Chaosdramon protege o reator.', 3, 52,
    [{ type: 'KILL_ENEMY', target_enemy_id: b4_2, quantity_required: 1 }],
    [{ type: 'BITS', quantity: 5000 }], [q4_2]);

  const q4_4 = await createQuest(c4, 'O Mestre das Trevas', 'VenomMyotismon ressurgiu.', 4, 55,
    [{ type: 'KILL_ENEMY', target_enemy_id: b4_3, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemPotionL, quantity: 5 }], [q4_3]);

  const q4_5 = await createQuest(c4, 'Fim dos Tempos', 'Millenniummon quer comprimir o tempo.', 5, 59,
    [{ type: 'KILL_ENEMY', target_enemy_id: b4_4, quantity_required: 1 }],
    [{ type: 'XP', quantity: 20000 }], [q4_4]);

  // Campaign 5
  const c5 = await insertOne('campaigns', { title: 'Deserto do Apocalipse', description: 'Onde os Lordes Demônios residem.', order: 5, is_active: true });

  const q5_1 = await createQuest(c5, 'Guardião do Submundo', 'Pharaohmon julga os invasores.', 1, 60,
    [{ type: 'KILL_ENEMY', target_enemy_id: e5_1_1, quantity_required: 5 }],
    [{ type: 'XP', quantity: 5000 }]);

  const q5_2 = await createQuest(c5, 'O Tesouro Perdido', 'Colete Escaravelhos Dourados.', 2, 62,
    [{ type: 'COLLECT_ITEM', target_item_id: itemGoldenScarab, quantity_required: 5 }],
    [{ type: 'BITS', quantity: 10000 }], [q5_1]);

  const q5_3 = await createQuest(c5, 'Ganância Fatal', 'Barbamon quer seus tesouros.', 3, 65,
    [{ type: 'KILL_ENEMY', target_enemy_id: b5_1, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemPotionL, quantity: 10 }], [q5_2]);

  const q5_4 = await createQuest(c5, 'Preguiça Destrutiva', 'Acorde Belphemon e derrote-o.', 4, 70,
    [{ type: 'KILL_ENEMY', target_enemy_id: b5_2, quantity_required: 1 }],
    [{ type: 'XP', quantity: 50000 }], [q5_3]);

  const q5_5 = await createQuest(c5, 'Orgulho Supremo', 'Lucemon SM desafia sua existência.', 5, 75,
    [{ type: 'KILL_ENEMY', target_enemy_id: b5_3, quantity_required: 1 }],
    [{ type: 'ITEM', item_id: itemDarkCore, quantity: 1 }], [q5_4]);

  const q5_6 = await createQuest(c5, 'O Pecado Original', 'Ogudomon, a encarnação de todos os pecados.', 6, 80,
    [{ type: 'KILL_ENEMY', target_enemy_id: b5_4, quantity_required: 1 }],
    [{ type: 'BITS', quantity: 1000000 }], [q5_5]);
};

exports.down = async function(knex) {
  // Wipe everything again on rollback to avoid inconsistent state
  const tablesToWipe = [
    'battles',
    'quest_rewards', 'quest_objectives', 'quest_dependencies', 'quests', 'campaigns',
    'map_enemies', 'enemy_drops', 'enemydex', 'items', 'maps', 'inventory', 'market_listings'
  ];
  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tablesToWipe) {
    await knex.schema.dropTableIfExists(table);
  }
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');
};
