const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authController = {
    signup: async (req, res) => {
        const { username, email, password_hash, role } = req.body;
        console.log("➡️ [DEBUG SIGNUP] Datos recibidos en el body:", req.body);
        
        try {
            if (!username || !email || !password_hash) {
                return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
            }
            
            // 1. Consulta de verificación usando comillas dobles explícitas
            const userCheck = await pool.query('SELECT id FROM "users" WHERE "email" = $1', [email]);
            if (userCheck.rows.length > 0) {
                return res.status(400).json({ message: 'El correo electrónico ya existe.' });
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password_hash, salt);
            const finalRole = (role === 'Admin') ? 'Admin' : 'Cliente';

            // 2. Consulta de inserción con comillas dobles estrictas
            const query = 'INSERT INTO "users" ("username", "email", "password_hash", "role") VALUES ($1, $2, $3, $4) RETURNING id, username, email, role';
            const { rows } = await pool.query(query, [username, email, passwordHash, finalRole]);

            return res.status(201).json({ message: 'Usuario registrado exitosamente.', user: rows[0] });
        } catch (error) {
            console.error("❌ ERROR DETALLADO EN EL BACKEND:", error);
            return res.status(500).json({ message: 'Error en el registro.', error: error.message });
        }
    },

    login: async (req, res) => {
        const { email, password } = req.body;
        try {
            if (!email || !password) return res.status(400).json({ message: 'Campos requeridos incompletos.' });

            const { rows } = await pool.query('SELECT * FROM "users" WHERE "email" = $1', [email]);
            const user = rows[0];
            if (!user) return res.status(401).json({ message: 'Credenciales inválidas.' });

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) return res.status(401).json({ message: 'Credenciales inválidas.' });

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '8h' }
            );

            return res.status(200).json({ message: 'Login exitoso.', token, user: { username: user.username, role: user.role } });
        } catch (error) {
            return res.status(500).json({ message: 'Error en autenticación.', error: error.message });
        }
    }
};

module.exports = authController;