const db = require('../config/db');

async function listTables() {
  const dbName = process.env.DB_NAME;
  const [rows] = await db.execute(dbName ? `SHOW TABLES FROM ${dbName}` : 'SHOW TABLES');
  const keys = rows.length ? Object.keys(rows[0]) : [];
  const key = keys.find(k => k.toLowerCase().includes('tables_in'));
  return rows.map(r => r[key]);
}

async function getColumns(table) {
  const [rows] = await db.execute(`DESCRIBE ${table}`);
  return rows || [];
}

function pick(cols, candidates) {
  for (const c of candidates) {
    if (cols.find(col => col.Field === c)) return c;
  }
  return null;
}

async function resolveUserDigimonsTable() {
  const tables = await listTables();
  const table = tables.find(t => t.toLowerCase() === 'users_digimons') ||
                tables.find(t => t.toLowerCase() === 'user_digimons') ||
                tables.find(t => /user.*digimon/i.test(t));
  if (!table) return null;
  const cols = await getColumns(table);
  const userIdCol = pick(cols, ['user_id', 'usuario_id', 'id_usuario', 'users_id', 'id_user', 'userId', 'usuarioId', 'idUser']);
  const digiIdCol = pick(cols, [
    'digidex_id', 'id_digidex',
    'digimon_id', 'id_digimon',
    'species_id',
    'digimonId', 'idDigimon',
    'id_digi', 'digi_id'
  ]);
  return { table, cols, userIdCol, digiIdCol };
}

module.exports = {
    resolveUserDigimonsTable
};
