exports.up = async function(knex) {
  // Helper to insert and get ID (assuming MySQL returns [id])
  const insertOne = async (table, data) => {
    const [id] = await knex(table).insert(data);
    return id;
  };

  // --- ITEMS ---
  // Valid types: 'consumable','equipable','object','quest'
  // Map 1 Items
  const itemMushroom = await insertOne('items', { name: 'Digi-Cogumelo', type: 'consumable', description: 'Um cogumelo que recupera 50 HP.', effect_target: 'hp', effect_value: 50, icon: '/items/mushroom.png' });
  const itemDataFrag = await insertOne('items', { name: 'Fragmento de Dados', type: 'object', description: 'Restos de dados de um Digimon.', icon: '/items/data_fragment.png' });
  const itemStinger = await insertOne('items', { name: 'Ferrão Quebrado', type: 'quest', description: 'Parte do ferrão de um Kuwagamon.', icon: '/items/stinger.png' });
  
  // Map 2 Items
  const itemGear = await insertOne('items', { name: 'Engrenagem Velha', type: 'object', description: 'Peça de máquina antiga.', icon: '/items/gear.png' });
  const itemOil = await insertOne('items', { name: 'Óleo de Máquina', type: 'quest', description: 'Óleo viscoso usado por digimons máquinas.', icon: '/items/oil.png' });
  const itemCircuit = await insertOne('items', { name: 'Circuito Lógico', type: 'quest', description: 'Chip retirado de Andromon.', icon: '/items/circuit.png' });

  // Map 3 Items
  const itemIceCrystal = await insertOne('items', { name: 'Cristal de Gelo', type: 'object', description: 'Nunca derrete.', icon: '/items/ice_crystal.png' });
  const itemWolfFur = await insertOne('items', { name: 'Pelo de Lobo Branco', type: 'object', description: 'Macio e quente.', icon: '/items/wolf_fur.png' });
  const itemSeadramonScale = await insertOne('items', { name: 'Escama de Metal', type: 'quest', description: 'Escama indestrutível.', icon: '/items/scale.png' });

  // Map 4 Items
  const itemDarkData = await insertOne('items', { name: 'Dados das Trevas', type: 'object', description: 'Corrompe quem toca.', icon: '/items/dark_data.png' });
  const itemPuppetString = await insertOne('items', { name: 'Fio de Marionete', type: 'quest', description: 'Fio resistente usado por Puppetmon.', icon: '/items/string.png' });
  const itemApocalypseShard = await insertOne('items', { name: 'Fragmento do Apocalipse', type: 'quest', description: 'A essência da destruição.', icon: '/items/shard.png' });

  // --- ENEMIES & DROPS ---
  // Valid difficulty: 'Normal', 'Boss'
  
  // Map 1 Enemies (Lv 0-15)
  const enemyAgumonB = await insertOne('enemydex', { name: 'Agumon (Black)', type: 'Vírus', hp: 250, attack: 25, defense: 10, base_level: 5, attack_speed: 1000, exp_reward: 20, bits_reward: 10, difficulty: 'Normal', sprite_path: '/enemies/agumon_black.png' });
  await insertOne('enemy_drops', { enemy_id: enemyAgumonB, item_id: itemDataFrag, drop_rate: 30.0 });

  const enemyGoblimon = await insertOne('enemydex', { name: 'Goblimon', type: 'Vírus', hp: 280, attack: 28, defense: 12, base_level: 7, attack_speed: 1000, exp_reward: 22, bits_reward: 12, difficulty: 'Normal', sprite_path: '/enemies/goblimon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyGoblimon, item_id: itemDataFrag, drop_rate: 30.0 });

  const enemyMushroomon = await insertOne('enemydex', { name: 'Mushroomon', type: 'Vírus', hp: 220, attack: 20, defense: 15, base_level: 6, attack_speed: 1000, exp_reward: 18, bits_reward: 8, difficulty: 'Normal', sprite_path: '/enemies/mushroomon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyMushroomon, item_id: itemMushroom, drop_rate: 40.0 });

  const bossKuwagamon = await insertOne('enemydex', { name: 'Kuwagamon', type: 'Vírus', hp: 1200, attack: 80, defense: 40, base_level: 15, attack_speed: 1200, exp_reward: 200, bits_reward: 100, difficulty: 'Boss', sprite_path: '/enemies/kuwagamon.png' });
  await insertOne('enemy_drops', { enemy_id: bossKuwagamon, item_id: itemStinger, drop_rate: 100.0 });

  // Map 2 Enemies (Lv 15-30)
  const enemyOgremon = await insertOne('enemydex', { name: 'Ogremon', type: 'Vírus', hp: 1500, attack: 150, defense: 80, base_level: 20, attack_speed: 1000, exp_reward: 150, bits_reward: 50, difficulty: 'Normal', sprite_path: '/enemies/ogremon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyOgremon, item_id: itemDataFrag, drop_rate: 20.0 });

  const enemyGuardromon = await insertOne('enemydex', { name: 'Guardromon', type: 'Vírus', hp: 2000, attack: 120, defense: 150, base_level: 22, attack_speed: 1500, exp_reward: 160, bits_reward: 60, difficulty: 'Normal', sprite_path: '/enemies/guardromon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyGuardromon, item_id: itemGear, drop_rate: 40.0 });
  await insertOne('enemy_drops', { enemy_id: enemyGuardromon, item_id: itemOil, drop_rate: 25.0 });

  const enemyAirdramon = await insertOne('enemydex', { name: 'Airdramon', type: 'Vacina', hp: 1800, attack: 180, defense: 70, base_level: 25, attack_speed: 900, exp_reward: 170, bits_reward: 55, difficulty: 'Normal', sprite_path: '/enemies/airdramon.png' });
  
  const bossAndromon = await insertOne('enemydex', { name: 'Andromon', type: 'Vacina', hp: 8000, attack: 400, defense: 300, base_level: 30, attack_speed: 1000, exp_reward: 1500, bits_reward: 500, difficulty: 'Boss', sprite_path: '/enemies/andromon.png' });
  await insertOne('enemy_drops', { enemy_id: bossAndromon, item_id: itemCircuit, drop_rate: 100.0 });

  // Map 3 Enemies (Lv 30-45)
  const enemyZudomon = await insertOne('enemydex', { name: 'Zudomon', type: 'Vacina', hp: 6000, attack: 500, defense: 400, base_level: 35, attack_speed: 1100, exp_reward: 800, bits_reward: 200, difficulty: 'Normal', sprite_path: '/enemies/zudomon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyZudomon, item_id: itemIceCrystal, drop_rate: 35.0 });

  const enemyPanjyamon = await insertOne('enemydex', { name: 'Panjyamon', type: 'Vacina', hp: 5500, attack: 550, defense: 300, base_level: 38, attack_speed: 800, exp_reward: 850, bits_reward: 220, difficulty: 'Normal', sprite_path: '/enemies/panjyamon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyPanjyamon, item_id: itemWolfFur, drop_rate: 40.0 });

  const enemyLillymon = await insertOne('enemydex', { name: 'Lillymon', type: 'Data', hp: 4500, attack: 600, defense: 250, base_level: 40, attack_speed: 700, exp_reward: 820, bits_reward: 210, difficulty: 'Normal', sprite_path: '/enemies/lillymon.png' });

  const bossMetalSeadramon = await insertOne('enemydex', { name: 'MetalSeadramon', type: 'Data', hp: 25000, attack: 1200, defense: 900, base_level: 45, attack_speed: 1000, exp_reward: 5000, bits_reward: 2000, difficulty: 'Boss', sprite_path: '/enemies/metalseadramon.png' });
  await insertOne('enemy_drops', { enemy_id: bossMetalSeadramon, item_id: itemSeadramonScale, drop_rate: 100.0 });

  // Map 4 Enemies (Lv 45+)
  const enemyMachinedramon = await insertOne('enemydex', { name: 'Machinedramon', type: 'Vírus', hp: 15000, attack: 1500, defense: 1200, base_level: 50, attack_speed: 1500, exp_reward: 2000, bits_reward: 800, difficulty: 'Normal', sprite_path: '/enemies/machinedramon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyMachinedramon, item_id: itemDarkData, drop_rate: 50.0 });

  const enemyPiedmon = await insertOne('enemydex', { name: 'Piedmon', type: 'Vírus', hp: 14000, attack: 1600, defense: 800, base_level: 55, attack_speed: 800, exp_reward: 2100, bits_reward: 850, difficulty: 'Normal', sprite_path: '/enemies/piedmon.png' });
  
  const enemyPuppetmon = await insertOne('enemydex', { name: 'Puppetmon', type: 'Vírus', hp: 13000, attack: 1400, defense: 900, base_level: 52, attack_speed: 1200, exp_reward: 1900, bits_reward: 750, difficulty: 'Normal', sprite_path: '/enemies/puppetmon.png' });
  await insertOne('enemy_drops', { enemy_id: enemyPuppetmon, item_id: itemPuppetString, drop_rate: 30.0 });

  const bossApocalymon = await insertOne('enemydex', { name: 'Apocalymon', type: 'Unknown', hp: 66666, attack: 3000, defense: 2000, base_level: 99, attack_speed: 1000, exp_reward: 10000, bits_reward: 10000, difficulty: 'Boss', sprite_path: '/enemies/apocalymon.png' });
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
  // Map Enemies
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

  // --- CAMPAIGNS & QUESTS ---
  const campaign = await insertOne('campaigns', {
    title: 'A Ameaça do Vírus X',
    description: 'Uma misteriosa corrupção está se espalhando pelo Digimundo, tornando digimons pacíficos em bestas agressivas. Investigue a origem e restaure a paz.',
    order: 1,
    is_active: true
  });

  // Quests Map 1
  const q1 = await insertOne('quests', { campaign_id: campaign, title: 'Limpeza da Floresta', description: 'Goblimons estão aterrorizando os recém-nascidos. Reduza o número deles para garantir a segurança da vila.', order: 1, min_level: 1 });
  await insertOne('quest_objectives', { quest_id: q1, type: 'KILL_ENEMY', target_enemy_id: enemyGoblimon, quantity_required: 5, description: 'Derrote 5 Goblimons' });
  await insertOne('quest_rewards', { quest_id: q1, type: 'BITS', quantity: 100 });
  await insertOne('quest_rewards', { quest_id: q1, type: 'XP', quantity: 50 });

  const q2 = await insertOne('quests', { campaign_id: campaign, title: 'Estudo de Campo', description: 'Mushroomons soltam esporos perigosos. Colete alguns cogumelos para que possamos criar um antídoto.', order: 2, min_level: 5 });
  await insertOne('quest_objectives', { quest_id: q2, type: 'COLLECT_ITEM', target_item_id: itemMushroom, quantity_required: 3, description: 'Colete 3 Digi-Cogumelos' });
  await insertOne('quest_rewards', { quest_id: q2, type: 'ITEM', item_id: itemDataFrag, quantity: 5 });

  const q3 = await insertOne('quests', { campaign_id: campaign, title: 'O Guardião Caído', description: 'Kuwagamon, o guardião da floresta, foi corrompido. É triste, mas você precisa derrotá-lo para abrir o caminho para o deserto.', order: 3, min_level: 10 });
  await insertOne('quest_objectives', { quest_id: q3, type: 'KILL_ENEMY', target_enemy_id: bossKuwagamon, quantity_required: 1, description: 'Derrote Kuwagamon' });
  await insertOne('quest_rewards', { quest_id: q3, type: 'ITEM', item_id: itemStinger, quantity: 1 });
  
  // Quests Map 2
  const q4 = await insertOne('quests', { campaign_id: campaign, title: 'Sucata Hostil', description: 'As máquinas no deserto estão descontroladas. Guardromons estão bloqueando a estrada principal.', order: 4, min_level: 15 });
  await insertOne('quest_objectives', { quest_id: q4, type: 'KILL_ENEMY', target_enemy_id: enemyGuardromon, quantity_required: 5, description: 'Derrote 5 Guardromons' });
  await insertOne('quest_rewards', { quest_id: q4, type: 'BITS', quantity: 500 });

  const q5 = await insertOne('quests', { campaign_id: campaign, title: 'Combustível para a Jornada', description: 'Precisamos de óleo para consertar o veículo de transporte. Os Guardromons e máquinas locais devem ter.', order: 5, min_level: 20 });
  await insertOne('quest_objectives', { quest_id: q5, type: 'COLLECT_ITEM', target_item_id: itemOil, quantity_required: 3, description: 'Colete 3 Óleos de Máquina' });
  await insertOne('quest_rewards', { quest_id: q5, type: 'XP', quantity: 500 });

  const q6 = await insertOne('quests', { campaign_id: campaign, title: 'Erro de Sistema', description: 'Andromon está emitindo um sinal que enlouquece as outras máquinas. Desligue-o.', order: 6, min_level: 25 });
  await insertOne('quest_objectives', { quest_id: q6, type: 'KILL_ENEMY', target_enemy_id: bossAndromon, quantity_required: 1, description: 'Derrote Andromon' });
  await insertOne('quest_rewards', { quest_id: q6, type: 'ITEM', item_id: itemCircuit, quantity: 1 });

  // Quests Map 3
  const q7 = await insertOne('quests', { campaign_id: campaign, title: 'Cristais de Energia', description: 'Precisamos de cristais de gelo para estabilizar nossos dados neste frio. Zudomons costumam carregar.', order: 7, min_level: 30 });
  await insertOne('quest_objectives', { quest_id: q7, type: 'COLLECT_ITEM', target_item_id: itemIceCrystal, quantity_required: 5, description: 'Colete 5 Cristais de Gelo' });
  await insertOne('quest_rewards', { quest_id: q7, type: 'BITS', quantity: 2000 });

  const q8 = await insertOne('quests', { campaign_id: campaign, title: 'A Fúria do Oceano', description: 'MetalSeadramon congelou o oceano digital e planeja expandir o gelo para todo o mundo. Pare-o agora!', order: 8, min_level: 40 });
  await insertOne('quest_objectives', { quest_id: q8, type: 'KILL_ENEMY', target_enemy_id: bossMetalSeadramon, quantity_required: 1, description: 'Derrote MetalSeadramon' });
  await insertOne('quest_rewards', { quest_id: q8, type: 'ITEM', item_id: itemSeadramonScale, quantity: 1 });

  // Quests Map 4
  const q9 = await insertOne('quests', { campaign_id: campaign, title: 'Marionetes', description: 'Puppetmons estão controlando outros digimons com seus fios. Corte o mal pela raiz.', order: 9, min_level: 45 });
  await insertOne('quest_objectives', { quest_id: q9, type: 'COLLECT_ITEM', target_item_id: itemPuppetString, quantity_required: 3, description: 'Colete 3 Fios de Marionete' });
  await insertOne('quest_rewards', { quest_id: q9, type: 'XP', quantity: 5000 });

  const q10 = await insertOne('quests', { campaign_id: campaign, title: 'O Juízo Final', description: 'Apocalymon surgiu. Se ele não for detido, o Mundo Digital será formatado. É a batalha final.', order: 10, min_level: 50 });
  await insertOne('quest_objectives', { quest_id: q10, type: 'KILL_ENEMY', target_enemy_id: bossApocalymon, quantity_required: 1, description: 'Derrote Apocalymon' });
  await insertOne('quest_rewards', { quest_id: q10, type: 'ITEM', item_id: itemApocalypseShard, quantity: 1 });

};

exports.down = async function(knex) {
  // Empty down
};
