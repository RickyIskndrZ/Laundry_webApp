const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Akses ditolak.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
};

/**
 * Role guard factory: izinkan hanya level tertentu
 * @param {...number} allowedLevels - id_level yang diizinkan
 */
const requireRole = (...allowedLevels) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Tidak terautentikasi.' });
    }
    if (!allowedLevels.includes(req.user.id_level)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Peran tidak memiliki izin.' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
