
exports.up = function(knex) {
  return knex.schema.hasColumn('enemydex', 'stage').then(exists => {
    if (!exists) {
      return knex.schema.table('enemydex', function(table) {
        table.string('stage').defaultTo('Rookie');
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.table('enemydex', function(table) {
    table.dropColumn('stage');
  });
};
