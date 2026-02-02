
const knex = require('./config/knex');

async function checkQuests() {
    try {
        const users = await knex('users').select('id', 'username');
        console.log('Users:', users.map(u => `${u.username} (${u.id})`));

        if (users.length > 0) {
            const userId = users[0].id; // Checking for first user, assuming it's the one logged in
            console.log(`Checking quests for user ${userId}...`);

            const userQuests = await knex('user_quests')
                .where('user_id', userId)
                .select('*');
            
            console.log('All User Quests:', userQuests);

            const activeQuests = await knex('user_quests')
                .where('user_id', userId)
                .andWhere('status', 'IN_PROGRESS')
                .select('*');

            console.log('Active User Quests (IN_PROGRESS):', activeQuests);
            
            if (activeQuests.length === 0) {
                console.log('WARNING: No active quests found for this user.');
            }
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkQuests();
