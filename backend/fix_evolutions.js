require('dotenv').config();
const db = require('./config/db');

async function fixEvolutionLevels() {
  try {
    // Set Rookies to evolve at Level 15
    const rookieIds = [1, 5, 9, 13, 17, 21, 25, 29];
    const sql = `UPDATE digidex SET evolution_level = 15 WHERE id IN (${rookieIds.join(',')})`;
    
    const [result] = await db.execute(sql);
    console.log(`Updated ${result.affectedRows} Digimons to evolution level 15.`);
    
    // Check if Champions need update (currently Lv 10, maybe should be 25?)
    // User only complained about level 2 jump, so fixing Rookies is priority.
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixEvolutionLevels();
