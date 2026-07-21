import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function Chat({ token, username, onLogout }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Conectar enviando el JWT en la propiedad 'auth' (handshake seguro)
    const socketConnection = io('https://ecohome-backend-main.onrender.com', {
      auth: { token }
    });

    socketConnection.on('connect', () => {
      console.log('Conectado exitosamente al chat de EcoHome Store');
    });

    // Escuchar el historial inicial (los últimos 10 mensajes enviados por el backend)
    socketConnection.on('history', (loadedHistory) => {
      setMessages(loadedHistory);
    });

    // Escuchar nuevos mensajes transmitidos en tiempo real por otros usuarios
    socketConnection.on('new-message', (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    // Escuchar errores de conexión (por ejemplo, si el token es inválido)
    socketConnection.on('connect_error', (err) => {
      console.error('Error de conexión al socket:', err.message);
      alert(`Error de autenticación: ${err.message}`);
      onLogout(); // Forzar cierre de sesión si falla la autenticación
    });

    setSocket(socketConnection);

    // Limpiar la conexión cuando el usuario cierre el chat o salga
    return () => {
      socketConnection.disconnect();
    };
  }, [token, onLogout]);

  // Auto-scroll al final del contenedor cuando llega un mensaje nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (text.trim() === '' || !socket) return;

    // Emitir el mensaje (el backend leerá el usuario directamente desde el JWT verificado)
    socket.emit('new-message', text);
    setText('');
  };

  return (
    <div style={styles.chatContainer}>
      <header style={styles.header}>
        <h3>EcoHome - Chat Interno</h3>
        <span>Usuario: <strong>{username}</strong></span>
        <button onClick={onLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
      </header>

      {/* Caja de mensajes */}
      <div style={styles.messagesBox}>
        {messages.map((msg, index) => (
          <div key={msg.id || index} style={styles.messageRow}>
            <span style={styles.msgUser}>{msg.username}:</span>
            <span style={styles.msgText}>{msg.text}</span>
            <small style={styles.msgTime}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de envío */}
      <form onSubmit={handleSendMessage} style={styles.inputArea}>
        <input
          type="text"
          placeholder="Escribe tu mensaje aquí..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={styles.textField}
        />
        <button type="submit" style={styles.sendBtn}>Enviar</button>
      </form>
    </div>
  );
}

// Estilos en JS para evitar usar CSS externo por ahora
const styles = {
  chatContainer: { maxWidth: '600px', margin: '20px auto', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', fontFamily: 'sans-serif', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: '#ffffff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2E7D32', color: 'white', padding: '10px 15px' },
  logoutBtn: { backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  messagesBox: { height: '400px', overflowY: 'scroll', padding: '15px', backgroundColor: '#f4f4f4' },
  messageRow: { marginBottom: '10px', padding: '8px 12px', borderRadius: '6px', backgroundColor: '#ffffff', borderLeft: '4px solid #2E7D32', display: 'flow-root' },
  msgUser: { fontWeight: 'bold', marginRight: '8px', color: '#1b5e20' },
  msgText: { color: '#333' },
  msgTime: { float: 'right', color: '#888', fontSize: '0.75em' },
  inputArea: { display: 'flex', borderTop: '1px solid #ddd' },
  textField: { flexGrow: 1, padding: '12px', border: 'none', outline: 'none', fontSize: '1em' },
  sendBtn: { padding: '12px 20px', backgroundColor: '#2E7D32', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }
};
