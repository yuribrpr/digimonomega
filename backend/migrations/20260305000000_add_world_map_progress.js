exports.up = async function up(knex) {
  const hasRouteOrder = await knex.schema.hasColumn('maps', 'route_order');
  if (!hasRouteOrder) {
    await knex.schema.alterTable('maps', table => {
      table.integer('route_order').notNullable().defaultTo(0);
    });
  }

  const hasWorldX = await knex.schema.hasColumn('maps', 'world_x');
  if (!hasWorldX) {
    await knex.schema.alterTable('maps', table => {
      table.decimal('world_x', 6, 2).nullable();
    });
  }

  const hasWorldY = await knex.schema.hasColumn('maps', 'world_y');
  if (!hasWorldY) {
    await knex.schema.alterTable('maps', table => {
      table.decimal('world_y', 6, 2).nullable();
    });
  }

  const hasMapIdInBattles = await knex.schema.hasColumn('battles', 'map_id');
  if (!hasMapIdInBattles) {
    await knex.schema.alterTable('battles', table => {
      table.integer('map_id').unsigned().nullable();
      table.index(['map_id'], 'battles_map_id_idx');
    });
  }

  const hasProgressTable = await knex.schema.hasTable('user_map_progress');
  if (!hasProgressTable) {
    await knex.schema.createTable('user_map_progress', table => {
      table.increments('id').primary();
      table.integer('user_id').notNullable();
      table.integer('map_id').unsigned().notNullable();
      table.timestamp('completed_at').defaultTo(knex.fn.now());
      table.unique(['user_id', 'map_id']);
      table.index(['map_id'], 'ump_map_id_idx');
    });
  }
};

exports.down = async function down(knex) {
  const hasTable = await knex.schema.hasTable('user_map_progress');
  if (hasTable) {
    await knex.schema.dropTable('user_map_progress');
  }

  const hasMapId = await knex.schema.hasColumn('battles', 'map_id');
  if (hasMapId) {
    await knex.schema.alterTable('battles', table => {
      table.dropColumn('map_id');
    });
  }

  const hasWorldY = await knex.schema.hasColumn('maps', 'world_y');
  if (hasWorldY) {
    await knex.schema.alterTable('maps', table => {
      table.dropColumn('world_y');
    });
  }

  const hasWorldX = await knex.schema.hasColumn('maps', 'world_x');
  if (hasWorldX) {
    await knex.schema.alterTable('maps', table => {
      table.dropColumn('world_x');
    });
  }

  const hasRouteOrder = await knex.schema.hasColumn('maps', 'route_order');
  if (hasRouteOrder) {
    await knex.schema.alterTable('maps', table => {
      table.dropColumn('route_order');
    });
  }
};
