exports.up = async function (knex) {
  const hasTable = await knex.schema.hasTable('quest_dependencies');
  if (!hasTable) {
    await knex.schema.createTable('quest_dependencies', function (table) {
      table.increments('id').primary();
      table
        .integer('quest_id')
        .unsigned()
        .references('id')
        .inTable('quests')
        .onDelete('CASCADE');
      table
        .integer('depends_on_quest_id')
        .unsigned()
        .references('id')
        .inTable('quests')
        .onDelete('CASCADE');
      table.unique(['quest_id', 'depends_on_quest_id']);
    });
  }
};

exports.down = async function (knex) {
  const hasTable = await knex.schema.hasTable('quest_dependencies');
  if (hasTable) {
    await knex.schema.dropTable('quest_dependencies');
  }
};
