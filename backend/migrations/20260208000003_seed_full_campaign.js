
exports.up = async function(knex) {
  // Compat guard: this legacy seed expects old enemydex columns (hp/attack/defense).
  // If the current schema already uses base_hp/base_attack/base_defense, skip safely.
  const hasLegacyHp = await knex.schema.hasColumn('enemydex', 'hp');
  if (!hasLegacyHp) {
    return;
  }

  // Helper to insert and get ID
  const insertOne = async (table, data) => {
    // Check if exists to avoid duplicates if run multiple times without rollback
    // But since we cleanup, we can just insert.
    // However, for safety in dev:
    const [id] = await knex(table).insert(data);
    return id;
  };

  // --- ICONS URLs (Placeholder URLs from OpenGameArt or similar free sources) ---
  // Using direct raw github urls from a public repo or similar is risky if they go down.
  // For this task, I will use a reliable placeholder service with text or generic RPG icons found online.
  // Actually, I'll use some specific URLs that are likely to stay or just standard icon paths if the frontend handles them.
  // But user asked for "icones da internet... Baixe-os ou coloque a url".
  // I will use some generic transparent icons from a free CDN or repo.
  // Let's use a public repo for RPG icons: https://github.com/AakashKumarNain/RPG-Game-Assets (just an example, maybe not real)
  // Better: https://game-icons.net/ (They have direct URLs? No, they generate)
  // I will use https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/... for berries/items if possible?
  // Or just use a placeholder image service that supports text, e.g. https://placehold.co/64x64/png?text=Item
  // But user said "ilustrem o icone especifico".
  // I will try to use some likely stable URLs for Digimon-like items or generic RPG items.
  
  const icons = {
    mushroom: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/tiny-mushroom.png',
    data: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/stardust.png',
    stinger: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poison-barb.png',
    gear: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/helix-fossil.png', // Looks like a gear/shell
    oil: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/max-elixir.png', // Potion like
    circuit: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dubious-disc.png',
    ice: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/never-melt-ice.png',
    fur: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/cleanse-tag.png', // Close enough?
    scale: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dragon-scale.png',
    dark: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/dusk-stone.png',
    string: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/destiny-knot.png',
    shard: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/comet-shard.png'
  };

  // --- ITEMS ---
  // Map 1 Items
  const itemMushroom = await insertOne('items', { name: 'Digi-Cogumelo', type: 'consumable', description: 'Um cogumelo que recupera 50 HP.', effect_target: 'hp', effect_value: 50, icon: icons.mushroom });
  const itemDataFrag = await insertOne('items', { name: 'Fragmento de Dados', type: 'material', description: 'Restos de dados de um Digimon.', icon: icons.data });
  const itemStinger = await insertOne('items', { name: 'Ferrão Quebrado', type: 'quest', description: 'Parte do ferrão de um Kuwagamon.', icon: icons.stinger });
  
  // Map 2 Items
  const itemGear = await insertOne('items', { name: 'Engrenagem Velha', type: 'material', description: 'Peça de máquina antiga.', icon: icons.gear });
  const itemOil = await insertOne('items', { name: 'Óleo de Máquina', type: 'quest', description: 'Óleo viscoso usado por digimons máquinas.', icon: icons.oil });
  const itemCircuit = await insertOne('items', { name: 'Circuito Lógico', type: 'quest', description: 'Chip retirado de Andromon.', icon: icons.circuit });

  // Map 3 Items
  const itemIceCrystal = await insertOne('items', { name: 'Cristal de Gelo', type: 'material', description: 'Nunca derrete.', icon: icons.ice });
  const itemWolfFur = await insertOne('items', { name: 'Pelo de Lobo Branco', type: 'material', description: 'Macio e quente.', icon: icons.fur });
  const itemSeadramonScale = await insertOne('items', { name: 'Escama de Metal', type: 'quest', description: 'Escama indestrutível.', icon: icons.scale });

  // Map 4 Items
  const itemDarkData = await insertOne('items', { name: 'Dados das Trevas', type: 'material', description: 'Corrompe quem toca.', icon: icons.dark });
  const itemPuppetString = await insertOne('items', { name: 'Fio de Marionete', type: 'quest', description: 'Fio resistente usado por Puppetmon.', icon: icons.string });
  const itemApocalypseShard = await insertOne('items', { name: 'Fragmento do Apocalipse', type: 'quest', description: 'A essência da destruição.', icon: icons.shard });

  // --- ENEMIES ---
  // Map 1 (0-15)
  const enemyAgumonB = await insertOne('enemydex', { name: 'Agumon (Black)', type: 'Vírus', stage: 'Rookie', hp: 300, attack: 30, defense: 10, base_level: 5, attack_speed: 1000, exp_reward: 20, bits_reward: 10, difficulty: 'Normal', sprite_path: '/enemies/agumon_black.png' });
  await insertOne('enemy_drops', { enemy_id: enemyAgumonB, item_id: itemDataFrag, drop_rate: 30.0 });

  const enemyGoblimon = await insertOne('enemydex', { name: 'Goblimon', type: 'Vírus', stage: 'Rookie', hp: 350, attack: 35, defense: 12, base_level: 7, attack_speed: 1000, exp_reward: 22, bits_reward: 12, difficulty: 'Normal', sprite_path: '/enemies/goblimon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyGoblimon, item_id: itemDataFrag, drop_rate: 30.0 });

  const enemyMushroomon = await insertOne('enemydex', { name: 'Mushroomon', type: 'Vírus', stage: 'Rookie', hp: 280, attack: 25, defense: 15, base_level: 6, attack_speed: 1000, exp_reward: 18, bits_reward: 8, difficulty: 'Normal', sprite_path: '/enemies/mushroomon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyMushroomon, item_id: itemMushroom, drop_rate: 40.0 });

  const bossKuwagamon = await insertOne('enemydex', { name: 'Kuwagamon', type: 'Vírus', stage: 'Champion', hp: 1500, attack: 100, defense: 40, base_level: 15, attack_speed: 1200, exp_reward: 200, bits_reward: 100, difficulty: 'Boss', sprite_path: '/enemies/kuwagamon.png' });
  await insertOne('enemy_drops', { enemy_id: bossKuwagamon, item_id: itemStinger, drop_rate: 100.0 });

  // Map 2 (15-30)
  const enemyOgremon = await insertOne('enemydex', { name: 'Ogremon', type: 'Vírus', stage: 'Champion', hp: 1800, attack: 150, defense: 80, base_level: 20, attack_speed: 1000, exp_reward: 150, bits_reward: 50, difficulty: 'Normal', sprite_path: '/enemies/ogremon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyOgremon, item_id: itemDataFrag, drop_rate: 20.0 });

  const enemyGuardromon = await insertOne('enemydex', { name: 'Guardromon', type: 'Vírus', stage: 'Champion', hp: 2200, attack: 120, defense: 150, base_level: 22, attack_speed: 1500, exp_reward: 160, bits_reward: 60, difficulty: 'Normal', sprite_path: '/enemies/guardromon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyGuardromon, item_id: itemGear, drop_rate: 40.0 });
  await insertOne('enemy_drops', { enemy_id: enemyGuardromon, item_id: itemOil, drop_rate: 25.0 });

  const enemyAirdramon = await insertOne('enemydex', { name: 'Airdramon', type: 'Vacina', stage: 'Champion', hp: 2000, attack: 180, defense: 70, base_level: 25, attack_speed: 900, exp_reward: 170, bits_reward: 55, difficulty: 'Normal', sprite_path: '/enemies/airdramon.png' });
  
  const bossAndromon = await insertOne('enemydex', { name: 'Andromon', type: 'Vacina', stage: 'Ultimate', hp: 8500, attack: 400, defense: 300, base_level: 30, attack_speed: 1000, exp_reward: 1500, bits_reward: 500, difficulty: 'Boss', sprite_path: '/enemies/andromon.png' });
  await insertOne('enemy_drops', { enemy_id: bossAndromon, item_id: itemCircuit, drop_rate: 100.0 });

  // Map 3 (30-45)
  const enemyZudomon = await insertOne('enemydex', { name: 'Zudomon', type: 'Vacina', stage: 'Ultimate', hp: 6500, attack: 500, defense: 400, base_level: 35, attack_speed: 1100, exp_reward: 800, bits_reward: 200, difficulty: 'Normal', sprite_path: '/enemies/zudomon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyZudomon, item_id: itemIceCrystal, drop_rate: 35.0 });

  const enemyPanjyamon = await insertOne('enemydex', { name: 'Panjyamon', type: 'Vacina', stage: 'Ultimate', hp: 6000, attack: 550, defense: 300, base_level: 38, attack_speed: 800, exp_reward: 850, bits_reward: 220, difficulty: 'Normal', sprite_path: '/enemies/panjyamon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyPanjyamon, item_id: itemWolfFur, drop_rate: 40.0 });

  const enemyLillymon = await insertOne('enemydex', { name: 'Lillymon', type: 'Data', stage: 'Ultimate', hp: 5000, attack: 600, defense: 250, base_level: 40, attack_speed: 700, exp_reward: 820, bits_reward: 210, difficulty: 'Normal', sprite_path: '/enemies/lillymon.png' });

  const bossMetalSeadramon = await insertOne('enemydex', { name: 'MetalSeadramon', type: 'Data', stage: 'Mega', hp: 30000, attack: 1200, defense: 900, base_level: 45, attack_speed: 1000, exp_reward: 5000, bits_reward: 2000, difficulty: 'Boss', sprite_path: '/enemies/metalseadramon.png' });
  await insertOne('enemy_drops', { enemy_id: bossMetalSeadramon, item_id: itemSeadramonScale, drop_rate: 100.0 });

  // Map 4 (45+)
  const enemyMachinedramon = await insertOne('enemydex', { name: 'Machinedramon', type: 'Vírus', stage: 'Mega', hp: 16000, attack: 1500, defense: 1200, base_level: 50, attack_speed: 1500, exp_reward: 2000, bits_reward: 800, difficulty: 'Normal', sprite_path: '/enemies/machinedramon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyMachinedramon, item_id: itemDarkData, drop_rate: 50.0 });

  const enemyPiedmon = await insertOne('enemydex', { name: 'Piedmon', type: 'Vírus', stage: 'Mega', hp: 15000, attack: 1600, defense: 800, base_level: 55, attack_speed: 800, exp_reward: 2100, bits_reward: 850, difficulty: 'Normal', sprite_path: '/enemies/piedmon.png' });
  
  const enemyPuppetmon = await insertOne('enemydex', { name: 'Puppetmon', type: 'Vírus', stage: 'Mega', hp: 14000, attack: 1400, defense: 900, base_level: 52, attack_speed: 1200, exp_reward: 1900, bits_reward: 750, difficulty: 'Normal', sprite_path: '/enemies/puppetmon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyPuppetmon, item_id: itemPuppetString, drop_rate: 30.0 });

  const bossApocalymon = await insertOne('enemydex', { name: 'Apocalymon', type: 'Unknown', stage: 'Mega', hp: 99999, attack: 3000, defense: 2000, base_level: 99, attack_speed: 1000, exp_reward: 10000, bits_reward: 10000, difficulty: 'Boss', sprite_path: '/enemies/apocalymon.png' });
  await insertOne('enemy_drops', { enemy_id: bossApocalymon, item_id: itemApocalypseShard, drop_rate: 100.0 });

  // --- MAPS ---
  const map1 = await insertOne('maps', {
    name: 'Floresta do Início',
    min_level: 1,
    description: 'Uma floresta vibrante onde digimons recém-nascidos costumavam brincar. Agora, sombras se movem entre as árvores e um zumbido estranho ecoa da clareira central.',
    type: 'Campanha',
    difficulty: 1.0,
    image_path: '/maps/forest_start.png'
  });
  await knex('map_enemies').insert([
    { map_id: map1, enemy_id: enemyAgumonB },
    { map_id: map1, enemy_id: enemyGoblimon },
    { map_id: map1, enemy_id: enemyMushroomon },
    { map_id: map1, enemy_id: bossKuwagamon }
  ]);

  const map2 = await insertOne('maps', {
    name: 'Deserto das Engrenagens',
    min_level: 15,
    description: 'Antigas fábricas abandonadas foram engolidas pela areia. O calor é sufocante e o som de metal rangendo é constante. Dizem que as máquinas aqui ganharam vida própria.',
    type: 'Campanha',
    difficulty: 2.0,
    image_path: '/maps/gear_desert.png'
  });
  await knex('map_enemies').insert([
    { map_id: map2, enemy_id: enemyOgremon },
    { map_id: map2, enemy_id: enemyGuardromon },
    { map_id: map2, enemy_id: enemyAirdramon },
    { map_id: map2, enemy_id: bossAndromon }
  ]);

  const map3 = await insertOne('maps', {
    name: 'Geleira Eterna',
    min_level: 30,
    description: 'Um deserto branco de gelo e neve. A temperatura é tão baixa que dados não protegidos começam a se fragmentar. Monstros antigos dormem sob o permafrost.',
    type: 'Campanha',
    difficulty: 3.0,
    image_path: '/maps/ice_glacier.png'
  });
  await knex('map_enemies').insert([
    { map_id: map3, enemy_id: enemyZudomon },
    { map_id: map3, enemy_id: enemyPanjyamon },
    { map_id: map3, enemy_id: enemyLillymon },
    { map_id: map3, enemy_id: bossMetalSeadramon }
  ]);

  const map4 = await insertOne('maps', {
    name: 'Núcleo das Trevas',
    min_level: 45,
    description: 'A fronteira com a Dark Area. O céu é estática roxa e o chão pulsa como carne viva. A presença do mal absoluto é palpável em cada pixel.',
    type: 'Campanha',
    difficulty: 4.0,
    image_path: '/maps/dark_core.png'
  });
  await knex('map_enemies').insert([
    { map_id: map4, enemy_id: enemyMachinedramon },
    { map_id: map4, enemy_id: enemyPiedmon },
    { map_id: map4, enemy_id: enemyPuppetmon },
    { map_id: map4, enemy_id: bossApocalymon }
  ]);

  // --- CAMPAIGNS & QUESTS (1 Campaign per Map, 10 Quests each) ---
  
  // Campaign 1: Floresta
  const camp1 = await insertOne('campaigns', {
    title: 'Capítulo 1: O Despertar das Sombras',
    description: 'Investigue o que está acontecendo na Floresta do Início.',
    order: 1,
    is_active: true
  });

  const q1_1 = await insertOne('quests', { campaign_id: camp1, title: 'Patrulha Matinal', description: 'Derrote 3 Goblimons para garantir o perímetro.', order: 1, min_level: 1 });
  await insertOne('quest_objectives', { quest_id: q1_1, type: 'KILL_ENEMY', target_enemy_id: enemyGoblimon, quantity_required: 3 });
  await insertOne('quest_rewards', { quest_id: q1_1, type: 'XP', quantity: 50 });

  const q1_2 = await insertOne('quests', { campaign_id: camp1, title: 'Coleta de Suprimentos', description: 'Precisamos de 5 Digi-Cogumelos para os feridos.', order: 2, min_level: 2 });
  await insertOne('quest_objectives', { quest_id: q1_2, type: 'COLLECT_ITEM', target_item_id: itemMushroom, quantity_required: 5 });
  await insertOne('quest_rewards', { quest_id: q1_2, type: 'ITEM', item_id: itemMushroom, quantity: 2 }); // Reward items back? Or money.
  
  const q1_3 = await insertOne('quests', { campaign_id: camp1, title: 'Ameaça Negra', description: 'Um Agumon Black foi visto. Derrote-o.', order: 3, min_level: 3 });
  await insertOne('quest_objectives', { quest_id: q1_3, type: 'KILL_ENEMY', target_enemy_id: enemyAgumonB, quantity_required: 1 });
  await insertOne('quest_rewards', { quest_id: q1_3, type: 'BITS', quantity: 50 });

  const q1_4 = await insertOne('quests', { campaign_id: camp1, title: 'Limpeza Geral', description: 'Derrote 10 Mushroomons.', order: 4, min_level: 4 });
  await insertOne('quest_objectives', { quest_id: q1_4, type: 'KILL_ENEMY', target_enemy_id: enemyMushroomon, quantity_required: 10 });
  
  const q1_5 = await insertOne('quests', { campaign_id: camp1, title: 'Dados Corrompidos', description: 'Colete 5 Fragmentos de Dados de qualquer inimigo.', order: 5, min_level: 5 });
  await insertOne('quest_objectives', { quest_id: q1_5, type: 'COLLECT_ITEM', target_item_id: itemDataFrag, quantity_required: 5 });

  const q1_6 = await insertOne('quests', { campaign_id: camp1, title: 'Invasão de Goblimons', description: 'Eles estão se multiplicando. Derrote 15 Goblimons.', order: 6, min_level: 6 });
  await insertOne('quest_objectives', { quest_id: q1_6, type: 'KILL_ENEMY', target_enemy_id: enemyGoblimon, quantity_required: 15 });

  const q1_7 = await insertOne('quests', { campaign_id: camp1, title: 'O Batedor', description: 'Derrote 5 Agumons Black.', order: 7, min_level: 7 });
  await insertOne('quest_objectives', { quest_id: q1_7, type: 'KILL_ENEMY', target_enemy_id: enemyAgumonB, quantity_required: 5 });

  const q1_8 = await insertOne('quests', { campaign_id: camp1, title: 'Preparação para o Chefe', description: 'Alcance o nível 10 para enfrentar o guardião.', order: 8, min_level: 8 });
  await insertOne('quest_objectives', { quest_id: q1_8, type: 'COLLECT_ITEM', target_item_id: itemMushroom, quantity_required: 10 }); // Just a filler objective

  const q1_9 = await insertOne('quests', { campaign_id: camp1, title: 'O Guardião Corrompido', description: 'Derrote Kuwagamon.', order: 9, min_level: 10 });
  await insertOne('quest_objectives', { quest_id: q1_9, type: 'KILL_ENEMY', target_enemy_id: bossKuwagamon, quantity_required: 1 });
  await insertOne('quest_rewards', { quest_id: q1_9, type: 'ITEM', item_id: itemStinger, quantity: 1 });

  const q1_10 = await insertOne('quests', { campaign_id: camp1, title: 'Vitória na Floresta', description: 'Entregue o Ferrão Quebrado para provar sua vitória.', order: 10, min_level: 12 });
  await insertOne('quest_objectives', { quest_id: q1_10, type: 'COLLECT_ITEM', target_item_id: itemStinger, quantity_required: 1 });
  await insertOne('quest_rewards', { quest_id: q1_10, type: 'BITS', quantity: 500 });
  
  // Dependencies Map 1
  await knex('quest_dependencies').insert([
    { quest_id: q1_9, depends_on_quest_id: q1_8 },
    { quest_id: q1_10, depends_on_quest_id: q1_9 }
  ]);


  // Campaign 2: Deserto
  const camp2 = await insertOne('campaigns', {
    title: 'Capítulo 2: Engrenagens da Guerra',
    description: 'As máquinas do deserto estão se movendo.',
    order: 2,
    is_active: true
  });
  
  // Quests 11-20 (using new IDs)
  const q2_1 = await insertOne('quests', { campaign_id: camp2, title: 'Primeiro Contato', description: 'Derrote 3 Guardromons.', order: 1, min_level: 15 });
  await insertOne('quest_objectives', { quest_id: q2_1, type: 'KILL_ENEMY', target_enemy_id: enemyGuardromon, quantity_required: 3 });

  const q2_2 = await insertOne('quests', { campaign_id: camp2, title: 'Óleo Vital', description: 'Colete 3 Óleos de Máquina.', order: 2, min_level: 16 });
  await insertOne('quest_objectives', { quest_id: q2_2, type: 'COLLECT_ITEM', target_item_id: itemOil, quantity_required: 3 });

  const q2_3 = await insertOne('quests', { campaign_id: camp2, title: 'Céu Perigoso', description: 'Derrote 3 Airdramons.', order: 3, min_level: 17 });
  await insertOne('quest_objectives', { quest_id: q2_3, type: 'KILL_ENEMY', target_enemy_id: enemyAirdramon, quantity_required: 3 });

  const q2_4 = await insertOne('quests', { campaign_id: camp2, title: 'Sucata', description: 'Colete 10 Engrenagens Velhas.', order: 4, min_level: 18 });
  await insertOne('quest_objectives', { quest_id: q2_4, type: 'COLLECT_ITEM', target_item_id: itemGear, quantity_required: 10 });

  const q2_5 = await insertOne('quests', { campaign_id: camp2, title: 'A Fúria de Ogremon', description: 'Derrote 5 Ogremons.', order: 5, min_level: 19 });
  await insertOne('quest_objectives', { quest_id: q2_5, type: 'KILL_ENEMY', target_enemy_id: enemyOgremon, quantity_required: 5 });

  const q2_6 = await insertOne('quests', { campaign_id: camp2, title: 'Resgate de Peças', description: 'Colete 5 Óleos e 5 Engrenagens.', order: 6, min_level: 20 });
  await insertOne('quest_objectives', { quest_id: q2_6, type: 'COLLECT_ITEM', target_item_id: itemOil, quantity_required: 5 });

  const q2_7 = await insertOne('quests', { campaign_id: camp2, title: 'Patrulha Aérea', description: 'Derrote 10 Airdramons.', order: 7, min_level: 22 });
  await insertOne('quest_objectives', { quest_id: q2_7, type: 'KILL_ENEMY', target_enemy_id: enemyAirdramon, quantity_required: 10 });

  const q2_8 = await insertOne('quests', { campaign_id: camp2, title: 'Exército de Ferro', description: 'Derrote 20 Guardromons.', order: 8, min_level: 25 });
  await insertOne('quest_objectives', { quest_id: q2_8, type: 'KILL_ENEMY', target_enemy_id: enemyGuardromon, quantity_required: 20 });

  const q2_9 = await insertOne('quests', { campaign_id: camp2, title: 'O Líder das Máquinas', description: 'Derrote Andromon.', order: 9, min_level: 28 });
  await insertOne('quest_objectives', { quest_id: q2_9, type: 'KILL_ENEMY', target_enemy_id: bossAndromon, quantity_required: 1 });
  await insertOne('quest_rewards', { quest_id: q2_9, type: 'ITEM', item_id: itemCircuit, quantity: 1 });

  const q2_10 = await insertOne('quests', { campaign_id: camp2, title: 'Análise do Circuito', description: 'Entregue o Circuito Lógico.', order: 10, min_level: 30 });
  await insertOne('quest_objectives', { quest_id: q2_10, type: 'COLLECT_ITEM', target_item_id: itemCircuit, quantity_required: 1 });
  
  // Dependencies Map 2
  await knex('quest_dependencies').insert([
    { quest_id: q2_9, depends_on_quest_id: q2_8 },
    { quest_id: q2_10, depends_on_quest_id: q2_9 }
  ]);


  // Campaign 3: Geleira
  const camp3 = await insertOne('campaigns', {
    title: 'Capítulo 3: Coração de Gelo',
    description: 'O frio eterno esconde segredos antigos.',
    order: 3,
    is_active: true
  });

  const q3_1 = await insertOne('quests', { campaign_id: camp3, title: 'Reconhecimento Gelado', description: 'Derrote 5 Zudomons.', order: 1, min_level: 30 });
  await insertOne('quest_objectives', { quest_id: q3_1, type: 'KILL_ENEMY', target_enemy_id: enemyZudomon, quantity_required: 5 });

  const q3_2 = await insertOne('quests', { campaign_id: camp3, title: 'Cristais', description: 'Colete 5 Cristais de Gelo.', order: 2, min_level: 31 });
  await insertOne('quest_objectives', { quest_id: q3_2, type: 'COLLECT_ITEM', target_item_id: itemIceCrystal, quantity_required: 5 });

  const q3_3 = await insertOne('quests', { campaign_id: camp3, title: 'A Fera Branca', description: 'Derrote 3 Panjyamons.', order: 3, min_level: 32 });
  await insertOne('quest_objectives', { quest_id: q3_3, type: 'KILL_ENEMY', target_enemy_id: enemyPanjyamon, quantity_required: 3 });

  const q3_4 = await insertOne('quests', { campaign_id: camp3, title: 'Peles Quentes', description: 'Colete 5 Pelos de Lobo.', order: 4, min_level: 33 });
  await insertOne('quest_objectives', { quest_id: q3_4, type: 'COLLECT_ITEM', target_item_id: itemWolfFur, quantity_required: 5 });

  const q3_5 = await insertOne('quests', { campaign_id: camp3, title: 'Jardim Congelado', description: 'Derrote 5 Lillymons.', order: 5, min_level: 34 });
  await insertOne('quest_objectives', { quest_id: q3_5, type: 'KILL_ENEMY', target_enemy_id: enemyLillymon, quantity_required: 5 });

  const q3_6 = await insertOne('quests', { campaign_id: camp3, title: 'Estudo do Gelo', description: 'Colete 20 Cristais de Gelo.', order: 6, min_level: 35 });
  await insertOne('quest_objectives', { quest_id: q3_6, type: 'COLLECT_ITEM', target_item_id: itemIceCrystal, quantity_required: 20 });

  const q3_7 = await insertOne('quests', { campaign_id: camp3, title: 'Guardiões da Neve', description: 'Derrote 10 Panjyamons.', order: 7, min_level: 36 });
  await insertOne('quest_objectives', { quest_id: q3_7, type: 'KILL_ENEMY', target_enemy_id: enemyPanjyamon, quantity_required: 10 });

  const q3_8 = await insertOne('quests', { campaign_id: camp3, title: 'Ameaça Floral', description: 'Derrote 10 Lillymons.', order: 8, min_level: 38 });
  await insertOne('quest_objectives', { quest_id: q3_8, type: 'KILL_ENEMY', target_enemy_id: enemyLillymon, quantity_required: 10 });

  const q3_9 = await insertOne('quests', { campaign_id: camp3, title: 'O Rei do Mar Metálico', description: 'Derrote MetalSeadramon.', order: 9, min_level: 40 });
  await insertOne('quest_objectives', { quest_id: q3_9, type: 'KILL_ENEMY', target_enemy_id: bossMetalSeadramon, quantity_required: 1 });
  await insertOne('quest_rewards', { quest_id: q3_9, type: 'ITEM', item_id: itemSeadramonScale, quantity: 1 });

  const q3_10 = await insertOne('quests', { campaign_id: camp3, title: 'Prova de Força', description: 'Entregue a Escama de Metal.', order: 10, min_level: 42 });
  await insertOne('quest_objectives', { quest_id: q3_10, type: 'COLLECT_ITEM', target_item_id: itemSeadramonScale, quantity_required: 1 });

  // Dependencies Map 3
  await knex('quest_dependencies').insert([
    { quest_id: q3_9, depends_on_quest_id: q3_8 },
    { quest_id: q3_10, depends_on_quest_id: q3_9 }
  ]);


  // Campaign 4: Trevas
  const camp4 = await insertOne('campaigns', {
    title: 'Capítulo 4: O Fim de Tudo',
    description: 'A batalha final pela existência do Digimundo.',
    order: 4,
    is_active: true
  });

  const q4_1 = await insertOne('quests', { campaign_id: camp4, title: 'Entrada no Abismo', description: 'Derrote 5 Machinedramons.', order: 1, min_level: 45 });
  await insertOne('quest_objectives', { quest_id: q4_1, type: 'KILL_ENEMY', target_enemy_id: enemyMachinedramon, quantity_required: 5 });

  const q4_2 = await insertOne('quests', { campaign_id: camp4, title: 'Dados Malditos', description: 'Colete 5 Dados das Trevas.', order: 2, min_level: 46 });
  await insertOne('quest_objectives', { quest_id: q4_2, type: 'COLLECT_ITEM', target_item_id: itemDarkData, quantity_required: 5 });

  const q4_3 = await insertOne('quests', { campaign_id: camp4, title: 'O Palhaço Sombrio', description: 'Derrote 3 Piedmons.', order: 3, min_level: 47 });
  await insertOne('quest_objectives', { quest_id: q4_3, type: 'KILL_ENEMY', target_enemy_id: enemyPiedmon, quantity_required: 3 });

  const q4_4 = await insertOne('quests', { campaign_id: camp4, title: 'Marionetista', description: 'Derrote 3 Puppetmons.', order: 4, min_level: 48 });
  await insertOne('quest_objectives', { quest_id: q4_4, type: 'KILL_ENEMY', target_enemy_id: enemyPuppetmon, quantity_required: 3 });

  const q4_5 = await insertOne('quests', { campaign_id: camp4, title: 'Fios do Destino', description: 'Colete 5 Fios de Marionete.', order: 5, min_level: 49 });
  await insertOne('quest_objectives', { quest_id: q4_5, type: 'COLLECT_ITEM', target_item_id: itemPuppetString, quantity_required: 5 });

  const q4_6 = await insertOne('quests', { campaign_id: camp4, title: 'Exército das Trevas', description: 'Derrote 10 Machinedramons.', order: 6, min_level: 50 });
  await insertOne('quest_objectives', { quest_id: q4_6, type: 'KILL_ENEMY', target_enemy_id: enemyMachinedramon, quantity_required: 10 });

  const q4_7 = await insertOne('quests', { campaign_id: camp4, title: 'Circo dos Horrores', description: 'Derrote 10 Piedmons.', order: 7, min_level: 51 });
  await insertOne('quest_objectives', { quest_id: q4_7, type: 'KILL_ENEMY', target_enemy_id: enemyPiedmon, quantity_required: 10 });

  const q4_8 = await insertOne('quests', { campaign_id: camp4, title: 'Teatro de Bonecos', description: 'Derrote 10 Puppetmons.', order: 8, min_level: 52 });
  await insertOne('quest_objectives', { quest_id: q4_8, type: 'KILL_ENEMY', target_enemy_id: enemyPuppetmon, quantity_required: 10 });

  const q4_9 = await insertOne('quests', { campaign_id: camp4, title: 'O Último Mestre das Trevas', description: 'Derrote Apocalymon.', order: 9, min_level: 55 });
  await insertOne('quest_objectives', { quest_id: q4_9, type: 'KILL_ENEMY', target_enemy_id: bossApocalymon, quantity_required: 1 });
  await insertOne('quest_rewards', { quest_id: q4_9, type: 'ITEM', item_id: itemApocalypseShard, quantity: 1 });

  const q4_10 = await insertOne('quests', { campaign_id: camp4, title: 'Salvação do Mundo', description: 'Entregue o Fragmento do Apocalipse. O mundo está salvo.', order: 10, min_level: 60 });
  await insertOne('quest_objectives', { quest_id: q4_10, type: 'COLLECT_ITEM', target_item_id: itemApocalypseShard, quantity_required: 1 });
  await insertOne('quest_rewards', { quest_id: q4_10, type: 'BITS', quantity: 100000 });

  // Dependencies Map 4
  await knex('quest_dependencies').insert([
    { quest_id: q4_9, depends_on_quest_id: q4_8 },
    { quest_id: q4_10, depends_on_quest_id: q4_9 }
  ]);

};

exports.down = async function(knex) {
  // Empty down
};
