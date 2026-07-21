require('dotenv').config(); // Cargar variables de entorno del archivo .env
const express = require('express');
const http = require('http'); // Módulo nativo de Node.js para envolver Express
const { Server } = require('socket.io'); // Importar el motor de Socket.IO
const cors = require('cors');

// Importaciones de tus archivos existentes en la estructura de EcoHome
const pool = require('./src/config/database'); 
// Forzamos la carga y prueba de la base de datos con un nombre diferente para evitar errores de duplicado
const miConexionProbador = require('./src/config/database');
const routes = require('./src/routes/routes'); 
const { authSocket } = require('./src/middlewares/authMiddleware'); 

const app = express();

// Configurar Middlewares tradicionales
app.use(cors({ origin: "*" })); 
app.use(express.json());

// Consumir tus rutas HTTP existentes (login, products, etc.)
app.use('/api', routes);

// 1. Envolver la app de Express en un servidor HTTP nativo
const server = http.createServer(app);

// 2. Inicializar Socket.IO acoplado al servidor HTTP
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// 3. Proteger la conexión de Socket.IO con el middleware JWT
io.use(authSocket);

// 4. Lógica de eventos de comunicación en tiempo real
io.on('connection', async (socket) => {
  console.log(`[Socket.IO] Usuario conectado: ${socket.user.username} (ID: ${socket.id})`);

  // Cargar el historial inicial: enviar los últimos 10 mensajes desde PostgreSQL
  try {
    const historyQuery = `
      SELECT m.id, u.username, m.text, m.created_at 
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 10;
    `;
    const { rows } = await pool.query(historyQuery);
    
    // Enviar de forma privada el historial ordenado cronológicamente al usuario que se conecta
    socket.emit('history', rows.reverse());
  } catch (err) {
    console.error('Error al recuperar el historial:', err.message);
  }

  // Escuchar cuando el cliente envía un mensaje nuevo
  socket.on('new-message', async (text) => {
    try {
      // Guardar el mensaje en PostgreSQL usando la FK vinculada al token autenticado
      const insertQuery = `
        INSERT INTO messages (user_id, text) 
        VALUES ($1, $2) 
        RETURNING id, text, created_at
      `;
      const { rows } = await pool.query(insertQuery, [socket.user.id, text]);

      const payload = {
        id: rows[0].id,
        username: socket.user.username,
        text: rows[0].text,
        created_at: rows[0].created_at
      };

      // Retransmitir el mensaje en vivo a TODOS los clientes conectados (broadcast)
      io.emit('new-message', payload);
    } catch (err) {
      console.error('Error guardando mensaje en la base de datos:', err.message);
    }
  });

  // Evento de desconexión del cliente
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Usuario desconectado: ${socket.user.username}`);
  });
});

// IMPORTANTE: Cambiar app.listen por server.listen para activar HTTP + WebSockets
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[EcoHome API] Ejecutándose en http://localhost:${PORT}`);
  console.log(`[EcoHome WebSockets] Canal de tiempo real activo en el mismo puerto.`);
});

