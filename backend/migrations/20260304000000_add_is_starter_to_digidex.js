exports.up = async function up(knex) {
  const hasColumn = await knex.schema.hasColumn('digidex', 'is_starter');
  if (!hasColumn) {
    await knex.schema.alterTable('digidex', function (table) {
      table.boolean('is_starter').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function down(knex) {
  const hasColumn = await knex.schema.hasColumn('digidex', 'is_starter');
  if (hasColumn) {
    await knex.schema.alterTable('digidex', function (table) {
      table.dropColumn('is_starter');
    });
  }
};
