import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chat from './components/Chat';

export default function App() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Estados para la Actividad 3 (Estadísticas y Productos)
  const [productCount, setProductCount] = useState(0);
  const [products, setProducts] = useState([]);
  
  // Campos temporales para el formulario de login
  const [tempUsername, setTempUsername] = useState('');
  const [tempToken, setTempToken] = useState('');

  // Campos para crear un nuevo producto desde la UI
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');

  const API_URL = 'https://ecohome-backend-main.onrender.com/api';

  // Función para sincronizar estadísticas y productos del usuario
  const fetchUserData = async (currentToken) => {
    try {
      const headers = { Authorization: `Bearer ${currentToken}` };

      // 1. Obtener estadísticas del usuario (/users/me/stats)
      const statsRes = await axios.get(`${API_URL}/users/me/stats`, { headers });
      setProductCount(statsRes.data.productCount);

      // 2. Obtener listado de productos con su respectivo creador
      const productsRes = await axios.get(`${API_URL}/products`, { headers });
      setProducts(productsRes.data);
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!tempUsername.trim() || !tempToken.trim()) {
      alert('Por favor, ingresa un nombre de usuario y tu token JWT.');
      return;
    }
    
    setUsername(tempUsername);
    setToken(tempToken);
    setIsLoggedIn(true);

    // Cargar datos iniciales al iniciar sesión
    await fetchUserData(tempToken);
  };

  const handleLogout = () => {
    setToken('');
    setUsername('');
    setProductCount(0);
    setProducts([]);
    setIsLoggedIn(false);
  };

  // Manejar la creación de producto y actualización inmediata de la UI
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) return;

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API_URL}/products`, {
        name: newProductName,
        price: parseFloat(newProductPrice)
      }, { headers });

      // Limpiar formulario de producto
      setNewProductName('');
      setNewProductPrice('');

      // Actualización inmediata del contador y la lista (ej: de 14 a 15)
      await fetchUserData(token);
    } catch (error) {
      console.error('Error al registrar el producto:', error);
    }
  };

  return (
    <div style={styles.appContainer}>
      {!isLoggedIn ? (
        <div style={styles.loginCard}>
          <h2 style={styles.title}>EcoHome Store</h2>
          <p style={styles.subtitle}>Acceso al Sistema y Trazabilidad</p>
          
          <form onSubmit={handleLoginSubmit} style={styles.form}>
            <label style={styles.label}>Nombre de Usuario</label>
            <input
              type="text"
              placeholder="Ej. Arturo"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              style={styles.input}
            />

            <label style={styles.label}>Token JWT de Acceso</label>
            <textarea
              placeholder="Pega aquí el token JWT generado por tu login de la API"
              value={tempToken}
              onChange={(e) => setTempToken(e.target.value)}
              style={styles.textarea}
            />

            <button type="submit" style={styles.loginBtn}>
              Conectarse al Sistema
            </button>
          </form>
        </div>
      ) : (
        <div style={styles.dashboardContainer}>
          {/* Cabecera exigida por la Actividad 3: Formato Nombre (N) */}
          <div style={styles.headerBar}>
            <h2>{username} ({productCount})</h2>
            <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
          </div>

          {/* Formulario rápido para crear producto y ver el incremento dinámico */}
          <div style={styles.card}>
            <h3>Registrar Nuevo Producto</h3>
            <form onSubmit={handleCreateProduct} style={styles.inlineForm}>
              <input 
                type="text" 
                placeholder="Nombre del producto" 
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                style={styles.inputSmall}
                required
              />
              <input 
                type="number" 
                placeholder="Precio" 
                value={newProductPrice}
                onChange={(e) => setNewProductPrice(e.target.value)}
                style={styles.inputSmall}
                required
              />
              <button type="submit" style={styles.actionBtn}>Crear</button>
            </form>
          </div>

          {/* Listado de productos indicando el creador */}
          <div style={styles.card}>
            <h3>Catálogo de Productos</h3>
            <ul style={styles.productList}>
              {products.map((prod) => (
                <li key={prod.id} style={styles.productItem}>
                  <span><strong>{prod.name}</strong> - ${prod.price}</span>
                  <small style={styles.creatorText}>Creado por ID: {prod.created_by}</small>
                </li>
              ))}
            </ul>
          </div>

          {/* Componente de Chat previo */}
          <div style={styles.card}>
            <Chat token={token} username={username} onLogout={handleLogout} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#e8f5e9',
    padding: '20px',
  },
  loginCard: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    maxWidth: '450px',
    width: '100%',
    textAlign: 'center',
    fontFamily: 'sans-serif'
  },
  dashboardContainer: {
    width: '100%',
    maxWidth: '700px',
    fontFamily: 'sans-serif'
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  title: { color: '#2E7D32', marginBottom: '5px' },
  subtitle: { color: '#666', fontSize: '0.9em', marginBottom: '25px' },
  form: { display: 'flex', flexDirection: 'column', textAlign: 'left' },
  inlineForm: { display: 'flex', gap: '10px', marginTop: '10px' },
  label: { fontWeight: 'bold', marginBottom: '5px', color: '#333', fontSize: '0.9em' },
  input: {
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '1em',
    outline: 'none'
  },
  inputSmall: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    flex: 1
  },
  textarea: {
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '0.9em',
    height: '100px',
    resize: 'none',
    outline: 'none',
    fontFamily: 'monospace'
  },
  loginBtn: {
    backgroundColor: '#2E7D32',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1em',
  },
  actionBtn: {
    backgroundColor: '#2E7D32',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  logoutBtn: {
    backgroundColor: '#c62828',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  productList: { listStyleType: 'none', padding: 0, margin: '10px 0 0 0' },
  productItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee'
  },
  creatorText: { color: '#777', fontStyle: 'italic' }
};
