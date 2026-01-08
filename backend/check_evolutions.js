require('dotenv').config();
const db = require('./config/db');

async function checkEvolutionLevels() {
  try {
    const [rows] = await db.execute('SELECT id, name, evolution_level, next_evolution_id FROM digidex WHERE next_evolution_id IS NOT NULL');
    
    console.log('Digimons with evolution configured:');
    rows.forEach(row => {
        if (row.evolution_level < 5) {
            console.log(`WARNING: ${row.name} (ID: ${row.id}) evolves at level ${row.evolution_level} to ID ${row.next_evolution_id}`);
        } else {
            console.log(`OK: ${row.name} (ID: ${row.id}) evolves at level ${row.evolution_level}`);
        }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEvolutionLevels();
