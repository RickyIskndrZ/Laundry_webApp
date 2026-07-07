const { getDb } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
  }

  try {
    const db = await getDb();
    const user = await db.get(`
      SELECT u.*, l.level_name 
      FROM user u 
      JOIN level l ON u.id_level = l.id_level 
      WHERE u.email = ?
    `, [email]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email tidak ditemukan.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Password salah.' });
    }

    const payload = {
      id_user: user.id_user,
      name: user.name,
      email: user.email,
      id_level: user.id_level,
      level_name: user.level_name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        user: payload,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const db = await getDb();
    const userRow = await db.get(`
      SELECT u.id_user, u.id_level, u.name, u.email, u.created_at, u.updated_at, l.level_name 
      FROM user u 
      JOIN level l ON u.id_level = l.id_level 
      WHERE u.id_user = ?
    `, [req.user.id_user]);

    if (!userRow) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    const user = {
      id_user: userRow.id_user,
      id_level: userRow.id_level,
      name: userRow.name,
      email: userRow.email,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
      level: {
        id_level: userRow.id_level,
        level_name: userRow.level_name,
      }
    };

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil profil.' });
  }
};

module.exports = { login, getProfile };

