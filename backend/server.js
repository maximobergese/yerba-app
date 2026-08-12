// server.js — Backend de Ronda de Yerbas
// Maneja la conexión a MySQL y expone los endpoints que usa el frontend.

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'cambiame123';

// --- Conexión a MySQL (pool de conexiones reutilizables) ---
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// Chequeo rápido de conexión al iniciar
pool.getConnection()
  .then(conn => {
    console.log('✅ Conectado a MySQL correctamente');
    conn.release();
  })
  .catch(err => {
    console.error('❌ No se pudo conectar a MySQL:', err.message);
  });

// --- Middleware simple de autenticación admin ---
// El frontend manda la contraseña en el header "x-admin-password" para
// las acciones que requieren ser administrador.
function requiereAdmin(req, res, next) {
  const clave = req.header('x-admin-password');
  if (clave !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña de administrador incorrecta' });
  }
  next();
}

// --- GET /api/opiniones — lista pública (solo no ocultas) ---
app.get('/api/opiniones', async (req, res) => {
  try {
    const [filas] = await pool.query(
      'SELECT id, nombre, apellido, ubicacion, marca, estrellas, texto, fecha_creacion FROM opiniones WHERE oculta = FALSE ORDER BY fecha_creacion DESC'
    );
    res.json(filas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudieron obtener las opiniones' });
  }
});

// --- GET /api/opiniones/admin — lista completa, incluye ocultas (requiere clave) ---
app.get('/api/opiniones/admin', requiereAdmin, async (req, res) => {
  try {
    const [filas] = await pool.query(
      'SELECT id, nombre, apellido, ubicacion, marca, estrellas, texto, oculta, fecha_creacion FROM opiniones ORDER BY fecha_creacion DESC'
    );
    res.json(filas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudieron obtener las opiniones' });
  }
});

// --- POST /api/opiniones — crear una opinión nueva (público) ---
app.post('/api/opiniones', async (req, res) => {
  const { nombre, apellido, ubicacion, marca, estrellas, texto } = req.body;

  // Validación básica del lado del servidor (nunca confiar solo en el frontend)
  if (!nombre || !apellido || !ubicacion || !marca || !texto) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  const estrellasNum = parseInt(estrellas);
  if (!Number.isInteger(estrellasNum) || estrellasNum < 1 || estrellasNum > 5) {
    return res.status(400).json({ error: 'Las estrellas deben ser un número entre 1 y 5' });
  }
  if (nombre.length > 60 || apellido.length > 60 || ubicacion.length > 80 || marca.length > 60 || texto.length > 600) {
    return res.status(400).json({ error: 'Algún campo supera el largo máximo permitido' });
  }

  try {
    const [resultado] = await pool.query(
      'INSERT INTO opiniones (nombre, apellido, ubicacion, marca, estrellas, texto) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre.trim(), apellido.trim(), ubicacion.trim(), marca.trim(), estrellasNum, texto.trim()]
    );
    res.status(201).json({ id: resultado.insertId, mensaje: 'Opinión publicada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo guardar la opinión' });
  }
});

// --- PATCH /api/opiniones/:id/ocultar — alternar oculta/visible (requiere clave) ---
app.patch('/api/opiniones/:id/ocultar', requiereAdmin, async (req, res) => {
  const { id } = req.params;
  const { oculta } = req.body; // true o false

  try {
    const [resultado] = await pool.query(
      'UPDATE opiniones SET oculta = ? WHERE id = ?',
      [oculta ? 1 : 0, id]
    );
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Opinión no encontrada' });
    }
    res.json({ mensaje: oculta ? 'Opinión ocultada' : 'Opinión vuelta a mostrar' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo actualizar la opinión' });
  }
});

// --- POST /api/admin/login — verificar contraseña de administrador ---
app.post('/api/admin/login', (req, res) => {
  const { clave } = req.body;
  if (clave === ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
  }
});

app.listen(PORT, () => {
  console.log(`🧉 Servidor de Ronda de Yerbas corriendo en http://localhost:${PORT}`);
});
