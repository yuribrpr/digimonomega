
const knex = require('./config/knex');

async function checkAllQuests() {
    try {
        const allUserQuests = await knex('user_quests').select('*');
        console.log('Total User Quests in DB:', allUserQuests.length);
        if (allUserQuests.length > 0) {
            console.log('First 5 entries:', allUserQuests.slice(0, 5));
        } else {
            console.log('No user_quests found in the entire database.');
        }

        const quests = await knex('quests').select('id', 'title');
        console.log('Available Quests definitions:', quests);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkAllQuests();
