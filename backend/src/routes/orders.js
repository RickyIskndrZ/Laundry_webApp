const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getStatusLogs,
  clearStatusLogs,
  updateOrderStatus,
  weighOnly,
  payOrder,
  cancelPayment,
  processPickup,
  deleteOrder,
  resetAllOrders,
} = require('../controllers/OrderController');

router.use(verifyToken);

// Semua yang login bisa lihat order
router.get('/', getAllOrders);

// Log perubahan status
router.get('/logs', getStatusLogs);
router.delete('/logs', requireRole(1), clearStatusLogs);

router.get('/:id', getOrderById);

// Admin & Operator bisa buat order
router.post('/', requireRole(1, 2), createOrder);

// Admin & Operator bisa ubah status (Diterima→Dicuci, Dicuci→Disetrika)
router.patch('/:id/status', requireRole(1, 2), updateOrderStatus);

// Admin & Operator bisa penimbangan (Disetrika→Penimbangan→Selesai)
router.patch('/:id/weigh', requireRole(1, 2), weighOnly);

// Admin & Operator bisa proses pembayaran (Selesai/Ready)
router.patch('/:id/pay', requireRole(1, 2), payOrder);
router.patch('/:id/cancel-pay', requireRole(1, 2), cancelPayment);

// Admin & Operator bisa proses pickup (Selesai→Diambil)
router.patch('/:id/pickup', requireRole(1, 2), processPickup);

// Admin saja bisa hapus (individu dan semua)
router.delete('/:id', requireRole(1), deleteOrder);
router.delete('/', requireRole(1), resetAllOrders);

module.exports = router;
