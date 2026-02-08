
exports.up = async function(knex) {
  // Helper to insert and get ID
  const insertOne = async (table, data) => {
    const [id] = await knex(table).insert(data);
    return id;
  };

  // Helper to find ID by name (since we are appending to existing data)
  const findId = async (table, name) => {
    const row = await knex(table).where('name', name).first();
    return row ? row.id : null;
  };

  // --- 1. Fix Attack Speed ---
  // Convert existing ms values (>= 100) to seconds
  await knex.raw(`UPDATE enemydex SET attack_speed = attack_speed / 1000 WHERE attack_speed >= 100`);
  // Ensure default is not huge
  await knex.raw(`UPDATE enemydex SET attack_speed = 2.0 WHERE attack_speed IS NULL OR attack_speed = 0`);

  // --- 2. Add New Items (Potions & Stat Boosters) ---
  const icons = {
    potionSmall: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/potion.png',
    potionMed: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/super-potion.png',
    hpUp: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hp-up.png',
    protein: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/protein.png',
    iron: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/iron.png',
    club: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-bone.png',
    jelly: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/honey.png'
  };

  const itemPotionSmall = await insertOne('items', { 
    name: 'Poção Pequena', 
    type: 'consumable', 
    description: 'Recupera 50 HP.', 
    effect_target: 'hp', 
    effect_value: 50, 
    recovery_type: 'current',
    icon: icons.potionSmall 
  });

  const itemPotionMed = await insertOne('items', { 
    name: 'Poção Média', 
    type: 'consumable', 
    description: 'Recupera 200 HP.', 
    effect_target: 'hp', 
    effect_value: 200, 
    recovery_type: 'current',
    icon: icons.potionMed 
  });

  const itemHpChip = await insertOne('items', { 
    name: 'Chip de Vitalidade', 
    type: 'consumable', 
    description: 'Aumenta o HP Máximo em 20 permanentemente.', 
    effect_target: 'hp', 
    effect_value: 20, 
    recovery_type: 'max',
    icon: icons.hpUp 
  });

  const itemAtkChip = await insertOne('items', { 
    name: 'Chip de Força', 
    type: 'consumable', 
    description: 'Aumenta o Ataque em 5 permanentemente.', 
    effect_target: 'attack', 
    effect_value: 5, 
    icon: icons.protein 
  });

  const itemDefChip = await insertOne('items', { 
    name: 'Chip de Defesa', 
    type: 'consumable', 
    description: 'Aumenta a Defesa em 5 permanentemente.', 
    effect_target: 'defense', 
    effect_value: 5, 
    icon: icons.iron 
  });

  const itemClub = await insertOne('items', { 
    name: 'Clava Quebrada', 
    type: 'quest', 
    description: 'Uma arma rudimentar usada por Goblimons.', 
    icon: icons.club 
  });

  const itemJelly = await insertOne('items', { 
    name: 'Geleia Real', 
    type: 'quest', 
    description: 'Substância rara produzida por insetos gigantes.', 
    icon: icons.jelly 
  });

  // --- 3. Add Drops to Existing Enemies ---
  // Get IDs of existing enemies
  const goblinId = await findId('enemydex', 'Goblimon');
  const ogreId = await findId('enemydex', 'Ogremon');
  const kuwagaId = await findId('enemydex', 'Kuwagamon');
  const androId = await findId('enemydex', 'Andromon');

  if (goblinId) {
    await insertOne('enemy_drops', { enemy_id: goblinId, item_id: itemPotionSmall, drop_rate: 15.0 });
    await insertOne('enemy_drops', { enemy_id: goblinId, item_id: itemClub, drop_rate: 40.0 });
  }

  if (ogreId) {
    await insertOne('enemy_drops', { enemy_id: ogreId, item_id: itemPotionMed, drop_rate: 10.0 });
    await insertOne('enemy_drops', { enemy_id: ogreId, item_id: itemAtkChip, drop_rate: 1.0 }); // Rare
  }

  if (kuwagaId) {
    await insertOne('enemy_drops', { enemy_id: kuwagaId, item_id: itemJelly, drop_rate: 50.0 });
  }

  if (androId) {
    await insertOne('enemy_drops', { enemy_id: androId, item_id: itemDefChip, drop_rate: 2.0 });
    await insertOne('enemy_drops', { enemy_id: androId, item_id: itemHpChip, drop_rate: 2.0 });
  }

  // --- 4. Create Narrative Quests (Kill + Drop) ---
  // Find a campaign to add to (e.g., Campaign 1)
  const camp1 = await knex('campaigns').where('order', 1).first();
  if (camp1) {
    // Quest 1: Caça aos Goblimons (Kill + Collect)
    const q1 = await insertOne('quests', { 
      campaign_id: camp1.id, 
      title: 'Ameaça dos Clavas', 
      description: 'Os Goblimons estão se armando e causando problemas nas redondezas. O chefe da vila pediu que você reduza o número deles e traga suas armas como prova. Cuidado, eles atacam em bando e não hesitam em usar força bruta.', 
      order: 6, 
      min_level: 5 
    });
    
    if (goblinId) {
      await insertOne('quest_objectives', { quest_id: q1, type: 'KILL_ENEMY', target_enemy_id: goblinId, quantity_required: 5 });
      await insertOne('quest_objectives', { quest_id: q1, type: 'COLLECT_ITEM', target_item_id: itemClub, quantity_required: 3 });
    }
    
    await insertOne('quest_rewards', { quest_id: q1, type: 'XP', quantity: 150 });
    await insertOne('quest_rewards', { quest_id: q1, type: 'ITEM', item_id: itemPotionSmall, quantity: 3 });

    // Quest 2: O Néctar Perdido (Collect Rare Item from Boss)
    const q2 = await insertOne('quests', { 
      campaign_id: camp1.id, 
      title: 'O Néctar Perdido', 
      description: 'Uma doença misteriosa atingiu os Digimons bebês. O único remédio conhecido é feito a partir da Geleia Real, guardada ferozmente pelo terrível Kuwagamon. Você precisa derrotá-lo e trazer o ingrediente para salvar os pequenos.', 
      order: 7, 
      min_level: 8 
    });

    if (kuwagaId) {
      await insertOne('quest_objectives', { quest_id: q2, type: 'KILL_ENEMY', target_enemy_id: kuwagaId, quantity_required: 1 });
      await insertOne('quest_objectives', { quest_id: q2, type: 'COLLECT_ITEM', target_item_id: itemJelly, quantity_required: 1 });
    }

    await insertOne('quest_rewards', { quest_id: q2, type: 'XP', quantity: 500 });
    await insertOne('quest_rewards', { quest_id: q2, type: 'ITEM', item_id: itemHpChip, quantity: 1 });
  }
};

exports.down = async function(knex) {
  // Reverting is complex due to dependencies, but for dev we usually just migrate:rollback
  // This is optional for this task
};
