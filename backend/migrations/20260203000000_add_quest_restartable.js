exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('quests', 'restartable');
  if (!hasColumn) {
    await knex.schema.alterTable('quests', function (table) {
      table.boolean('restartable').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function (knex) {
  const hasColumn = await knex.schema.hasColumn('quests', 'restartable');
  if (hasColumn) {
    await knex.schema.alterTable('quests', function (table) {
      table.dropColumn('restartable');
    });
  }
};

