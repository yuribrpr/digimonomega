exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'last_seen_at');
  if (!hasColumn) {
    await knex.schema.alterTable('users', function (table) {
      table.timestamp('last_seen_at').nullable().defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'last_seen_at');
  if (hasColumn) {
    await knex.schema.alterTable('users', function (table) {
      table.dropColumn('last_seen_at');
    });
  }
};
