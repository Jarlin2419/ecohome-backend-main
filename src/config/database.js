const { Pool } = require('pg');
require('dotenv').config();

// Si existe DATABASE_URL (en Render), la usa. Si no (en tu PC), usa tus datos locales.
const connectionString = process.env.DATABASE_URL;

const pool = new Pool(
    connectionString
        ? {
              connectionString: connectionString,
              ssl: {
                  rejectUnauthorized: false // Obligatorio para conexiones seguras en Render
              }
          }
        : {
              host: 'localhost',
              user: 'postgres',
              password: '222222222',
              database: 'ecohome_store_db',
              port: 5432,
          }
);

pool.on('connect', () => {
    console.log('[DB] Pool de conexiones establecido con PostgreSQL.');
});

// Prueba de conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error crítico al conectar con PostgreSQL:', err.message);
  } else {
    console.log('🟢 ¡Conexión exitosa a PostgreSQL establecida correctamente!');
  }
});

module.exports = pool;