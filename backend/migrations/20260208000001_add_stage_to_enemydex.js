
exports.up = function(knex) {
  return knex.schema.hasColumn('enemydex', 'stage').then(exists => {
    if (!exists) {
      return knex.schema.table('enemydex', function(table) {
        table.enum('stage', ['Rookie', 'Champion', 'Ultimate', 'Mega', 'Unknown']).defaultTo('Unknown');
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.table('enemydex', function(table) {
    table.dropColumn('stage');
  });
};
