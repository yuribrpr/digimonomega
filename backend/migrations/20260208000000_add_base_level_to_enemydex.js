exports.up = function(knex) {
  return knex.schema.hasColumn('enemydex', 'base_level').then(exists => {
    if (!exists) {
      return knex.schema.table('enemydex', function(table) {
        table.integer('base_level').defaultTo(1);
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.table('enemydex', function(table) {
    table.dropColumn('base_level');
  });
};
