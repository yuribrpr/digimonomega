exports.up = async function up(knex) {
  const result = await knex.raw(
    `
    SELECT COLUMN_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'items'
      AND COLUMN_NAME = 'type'
    LIMIT 1
    `
  );

  const rows = result && (result[0] || result.rows || result);
  const row = rows && rows[0];
  const columnType = row && (row.COLUMN_TYPE || row.column_type);
  if (typeof columnType !== 'string') return;

  const lower = columnType.toLowerCase();
  if (!lower.startsWith('enum(')) return;

  const match = columnType.match(/^enum\((.*)\)$/i);
  if (!match) return;

  const inner = match[1];
  const parts = inner.split(/,(?=(?:[^']*'[^']*')*[^']*$)/g).map(p => p.trim());
  const values = parts.map(p => p.replace(/^'/, '').replace(/'$/, '').replace(/''/g, "'"));
  if (values.includes('quest')) return;

  const newValues = [...values, 'quest'];
  const enumSql = newValues.map(v => `'${String(v).replace(/'/g, "''")}'`).join(',');
  const nullable = row && String(row.IS_NULLABLE || row.is_nullable).toUpperCase() === 'YES';
  const nullSql = nullable ? 'NULL' : 'NOT NULL';

  await knex.raw(`ALTER TABLE items MODIFY COLUMN type ENUM(${enumSql}) ${nullSql}`);
};

exports.down = async function down() {};

