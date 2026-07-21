const jwt = require('jsonwebtoken');

const authJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado. Token no suministrado.' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_jwt', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado.' });
    }
    req.user = user;
    next();
  });
};

const authorizeRole = (roleRequired) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== roleRequired) {
      return res.status(403).json({ message: `Acceso restringido. Requiere rol: [${roleRequired}].` });
    }
    next();
  };
};

const authSocket = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers['authorization'];
  
  if (!token) {
    return next(new Error('Autenticación fallida: Token no proporcionado.'));
  }

  // Si viene con la palabra Bearer, la limpiamos
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;

  jwt.verify(cleanToken, process.env.JWT_SECRET || 'tu_secreto_jwt', (err, user) => {
    if (err) {
      return next(new Error('Autenticación fallida: Token inválido.'));
    }
    socket.user = user; // Guardamos los datos del usuario en el socket
    next();
  });
};

module.exports = { authJWT, authorizeRole, authSocket };