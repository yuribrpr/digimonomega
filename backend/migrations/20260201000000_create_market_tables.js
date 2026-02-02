exports.up = async function(knex) {
  // Market Listings
  const hasListings = await knex.schema.hasTable('market_listings');
  if (!hasListings) {
    await knex.schema.createTable('market_listings', function(table) {
      table.increments('id').primary();
      table.integer('seller_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.enum('listing_type', ['item', 'digimon']).notNullable();
      table.integer('item_id').nullable().references('id').inTable('items').onDelete('CASCADE');
      table.integer('digimon_id').nullable().references('id').inTable('user_digimons').onDelete('CASCADE');
      table.integer('quantity').defaultTo(1);
      table.integer('price').notNullable();
      table.enum('status', ['active', 'sold', 'cancelled']).defaultTo('active');
      table.integer('buyer_id').nullable().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('sold_at').nullable();
    });
  }

  // Market Notifications
  const hasNotifications = await knex.schema.hasTable('market_notifications');
  if (!hasNotifications) {
    await knex.schema.createTable('market_notifications', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.text('message').notNullable();
      table.boolean('is_read').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  // Add is_in_market to user_digimons
  const hasColumn = await knex.schema.hasColumn('user_digimons', 'is_in_market');
  if (!hasColumn) {
    await knex.schema.table('user_digimons', function(table) {
      table.boolean('is_in_market').defaultTo(false);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.table('user_digimons', function(table) {
    table.dropColumn('is_in_market');
  });
  await knex.schema.dropTableIfExists('market_notifications');
  await knex.schema.dropTableIfExists('market_listings');
};
