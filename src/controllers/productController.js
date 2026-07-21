const pool = require('../config/database');

const productController = {
    // 1. MODIFICADO: Trae los productos junto al nombre del usuario creador (JOIN)
    getAll: async (req, res) => {
        try {
            const query = `
                SELECT 
                    p.id, 
                    p.name, 
                    p.price, 
                    p.created_at, 
                    p.updated_at,
                    u.username AS created_by_username
                FROM products p
                LEFT JOIN users u ON p.created_by = u.id
                ORDER BY p.id ASC;
            `;
            const { rows } = await pool.query(query);
            return res.status(200).json(rows);
        } catch (error) {
            return res.status(500).json({ message: 'Error de lectura del catálogo.', error: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const query = `
                SELECT 
                    p.id, 
                    p.name, 
                    p.price, 
                    p.created_at, 
                    p.updated_at,
                    u.username AS created_by_username
                FROM products p
                LEFT JOIN users u ON p.created_by = u.id
                WHERE p.id = $1;
            `;
            const { rows } = await pool.query(query, [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
            return res.status(200).json(rows[0]);
        } catch (error) {
            return res.status(500).json({ message: 'Error de lectura de producto.', error: error.message });
        }
    },

    // 2. MODIFICADO: Extrae el ID del usuario del JWT (req.user.id) y lo guarda en created_by
    create: async (req, res) => {
        const { name, price } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ message: 'Nombre inválido.' });
        if (typeof price !== 'number' || price <= 0) return res.status(400).json({ message: 'El precio debe ser un número mayor a 0.' });

        try {
            const userId = req.user.id; // Obtenido del token JWT gracias a authJWT

            const query = `
                INSERT INTO products (name, price, created_by) 
                VALUES ($1, $2, $3) 
                RETURNING *;
            `;
            const { rows } = await pool.query(query, [name.trim(), price, userId]);
            return res.status(201).json({ message: 'Producto registrado con trazabilidad.', product: rows[0] });
        } catch (error) {
            return res.status(500).json({ message: 'Error de inserción.', error: error.message });
        }
    },

    update: async (req, res) => {
        const { name, price } = req.body;
        if (!name || name.trim() === '') return res.status(400).json({ message: 'Nombre inválido.' });
        if (typeof price !== 'number' || price <= 0) return res.status(400).json({ message: 'El precio debe ser un número mayor a 0.' });

        try {
            const { rows } = await pool.query('UPDATE products SET name = $1, price = $2, updated_at = NOW() WHERE id = $3 RETURNING *', [name.trim(), price, req.params.id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
            return res.status(200).json({ message: 'Producto actualizado.', product: rows[0] });
        } catch (error) {
            return res.status(500).json({ message: 'Error de actualización.', error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { rows } = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);
            if (rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado.' });
            return res.status(200).json({ message: 'Producto eliminado físicamente.' });
        } catch (error) {
            return res.status(500).json({ message: 'Error de eliminación.', error: error.message });
        }
    }
};

// Agrega esto al final de tu productController.js (usando la misma conexión que ya usa el controlador)

module.exports = productController;