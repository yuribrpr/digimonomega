const knex = require('./config/knex');

async function cleanup() {
  try {
    await knex.schema.dropTableIfExists('user_quests');
    await knex.schema.dropTableIfExists('quest_rewards');
    await knex.schema.dropTableIfExists('quest_objectives');
    await knex.schema.dropTableIfExists('quests');
    await knex.schema.dropTableIfExists('campaigns');
    console.log('Cleanup successful');
  } catch (err) {
    console.error('Cleanup failed:', err);
  } finally {
    process.exit();
  }
}

cleanup();
