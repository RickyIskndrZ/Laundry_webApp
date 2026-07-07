const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getAllArchives,
  undoArchive,
  deletePermanentArchive,
} = require('../controllers/ArchiveController');

router.use(verifyToken);

// Semua pengguna login bisa melihat arsip
router.get('/', getAllArchives);

// Undo pickup dan Hapus Permanen membutuhkan akses khusus (misal Pimpinan dan Admin)
// Level 1 = Admin, Level 3 = Pimpinan (sesuai contoh sebelumnya)
// Tapi kita bisa set Admin dan Operator juga jika perlu.
// Untuk keamanan arsip, biasanya Admin & Pimpinan yang bisa hapus permanen.
router.delete('/:id/undo', requireRole(1, 2, 3), undoArchive);
router.delete('/:id/permanent', requireRole(1, 3), deletePermanentArchive);

module.exports = router;
