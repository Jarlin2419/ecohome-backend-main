const { Pool } = require('pg');
require('dotenv').config();


const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = pool;

pool.on('connect', () => {
    console.log('[DB] Pool de conexiones establecido con PostgreSQL.');
});

// >>> ESTE ES EL LUGAR DE LA PRUEBA (Antes del module.exports) <<<
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error crítico al conectar con PostgreSQL:', err.message);
  } else {
    console.log('🟢 ¡Conexión exitosa a PostgreSQL establecida correctamente!');
  }
});

module.exports = pool;


/*const { Pool } = require('pg');
require('dotenv').config();

// 1. ESPÍA DE VARIABLES: Imprimimos en consola qué está leyendo Node realmente
console.log('--- [DIAGNÓSTICO DE VARIABLES .ENV] ---');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Port:', process.env.DB_PORT);
console.log('Database Name:', process.env.DB_NAME);
console.log('Password (primeros 3 caracteres):', process.env.DB_PASS ? process.env.DB_PASS.substring(0, 3) + '...' : '❌ UNDEFINED');
console.log('----------------------------------------');

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

pool.on('connect', () => {
    console.log('[DB] Pool de conexiones establecido con PostgreSQL.');
});

// 2. ESPÍA DE POSTGRES: Le preguntamos a Postgres en qué base de datos física cayó
pool.query('SELECT current_database(), current_user', (err, res) => {
  if (err) {
    console.error('❌ Error crítico al conectar con PostgreSQL:', err.message);
  } else {
    const dbInfo = res.rows[0];
    console.log(`🟢 ¡Conexión física exitosa! Postgres dice que estás en la base de datos: "${dbInfo.current_database}" con el usuario: "${dbInfo.current_user}"`);
  }
});

module.exports = pool;*/
