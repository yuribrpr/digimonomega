const db = require('./config/db');

async function migrate() {
  try {
    console.log('Verificando colunas da tabela battles...');
    const [cols] = await db.execute('DESCRIBE battles');
    const colNames = cols.map(c => c.Field);
    console.log('Colunas atuais:', colNames);

    if (!colNames.includes('user_current_hp')) {
      console.log('Adicionando coluna user_current_hp...');
      await db.execute('ALTER TABLE battles ADD COLUMN user_current_hp INT DEFAULT NULL');
      console.log('Coluna user_current_hp adicionada.');
    }

    if (!colNames.includes('user_max_hp')) {
        console.log('Adicionando coluna user_max_hp...');
        await db.execute('ALTER TABLE battles ADD COLUMN user_max_hp INT DEFAULT NULL');
        console.log('Coluna user_max_hp adicionada.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
