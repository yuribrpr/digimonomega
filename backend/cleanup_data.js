
require('dotenv').config();
const knex = require('knex')(require('./knexfile').development);

async function cleanup() {
  try {
    console.log('Cleaning up data...');
    // Delete in order of dependencies (child first)
    await knex('quest_dependencies').del();
    await knex('quest_rewards').del();
    await knex('quest_objectives').del();
    await knex('user_quests').del();
    await knex('quests').del();
    await knex('campaigns').del();
    
    await knex('map_enemies').del();
    await knex('maps').del();
    
    await knex('enemy_drops').del();
    await knex('battles').del(); // Dependent on enemydex
    await knex('enemydex').del();
    
    await knex('inventory').del();
    await knex('items').del();

    console.log('Data cleaned.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();
