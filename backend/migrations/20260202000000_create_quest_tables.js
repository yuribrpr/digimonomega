exports.up = async function(knex) {
  // 1. Campaigns Table
  await knex.schema.createTable('campaigns', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.integer('order').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 2. Quests Table
  await knex.schema.createTable('quests', function(table) {
    table.increments('id').primary();
    table.integer('campaign_id').unsigned().references('id').inTable('campaigns').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.integer('npc_digimon_id').references('id').inTable('digidex').onDelete('SET NULL'); // NPC from Digidex (Signed int)
    table.integer('order').defaultTo(0);
    table.integer('min_level').defaultTo(1); // Optional requirement
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. Quest Objectives Table
  await knex.schema.createTable('quest_objectives', function(table) {
    table.increments('id').primary();
    table.integer('quest_id').unsigned().references('id').inTable('quests').onDelete('CASCADE');
    table.enum('type', ['COLLECT_ITEM', 'KILL_ENEMY']).notNullable();
    table.integer('target_item_id').references('id').inTable('items').onDelete('CASCADE').nullable(); // Signed int
    table.integer('target_enemy_id').references('id').inTable('enemydex').onDelete('CASCADE').nullable(); // Signed int
    table.integer('quantity_required').notNullable().defaultTo(1);
    table.string('description').nullable(); // Override description if needed
  });

  // 4. Quest Rewards Table
  await knex.schema.createTable('quest_rewards', function(table) {
    table.increments('id').primary();
    table.integer('quest_id').unsigned().references('id').inTable('quests').onDelete('CASCADE');
    table.enum('type', ['ITEM', 'DIGIMON', 'BITS', 'XP']).notNullable();
    table.integer('item_id').references('id').inTable('items').onDelete('CASCADE').nullable(); // Signed int
    table.integer('digimon_id').references('id').inTable('digidex').onDelete('CASCADE').nullable(); // Signed int
    table.integer('quantity').notNullable().defaultTo(1); // Amount for Items, Bits, XP
  });

  // 5. User Quest Progress Table
  await knex.schema.createTable('user_quests', function(table) {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('CASCADE'); // Signed int
    table.integer('quest_id').unsigned().references('id').inTable('quests').onDelete('CASCADE');
    table.enum('status', ['IN_PROGRESS', 'COMPLETED', 'CLAIMED']).defaultTo('IN_PROGRESS');
    table.json('progress'); // Store progress like { "objective_id": current_count }
    table.timestamp('started_at').defaultTo(knex.fn.now());
    table.timestamp('completed_at').nullable();
    
    // Unique constraint to prevent duplicate active quests for same user/quest
    table.unique(['user_id', 'quest_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_quests');
  await knex.schema.dropTableIfExists('quest_rewards');
  await knex.schema.dropTableIfExists('quest_objectives');
  await knex.schema.dropTableIfExists('quests');
  await knex.schema.dropTableIfExists('campaigns');
};
