const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const { authJWT, authorizeRole } = require('../middlewares/authMiddleware');

// 1. IMPORTAR CORRECTAMENTE EL POOL DE LA BASE DE DATOS
const pool = require('../config/database'); 

// Autenticación
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);

// Catálogo Público
router.get('/products', productController.getAll);
router.get('/products/:id', productController.getById);

// Gestión Comercial (Protegido para usuarios autenticados)
router.post('/products', authJWT, productController.create);
router.put('/products/:id', authJWT, authorizeRole('Admin'), productController.update);
router.patch('/products/:id', authJWT, authorizeRole('Admin'), productController.update);
router.delete('/products/:id', authJWT, authorizeRole('Admin'), productController.delete);

// Endpoint para obtener las estadísticas del usuario autenticado
router.get('/users/me/stats', authJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Contar cuántos productos pertenecen a este usuario
    const query = 'SELECT COUNT(*) AS product_count FROM products WHERE created_by = $1';
    const { rows } = await pool.query(query, [userId]);
    
    const count = parseInt(rows[0].product_count, 10);

    res.json({
      username: req.user.username,
      productCount: count
    });
  } catch (error) {
    console.error("Error en /users/me/stats:", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;