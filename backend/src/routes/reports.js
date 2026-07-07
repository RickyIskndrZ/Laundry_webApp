const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getSalesReport, getDashboardStats } = require('../controllers/ReportController');

router.use(verifyToken);

// Dashboard stats - semua yang login bisa akses
router.get('/dashboard', getDashboardStats);

// Laporan penjualan - hanya Pimpinan & Admin
router.get('/sales', requireRole(1, 3), getSalesReport);

module.exports = router;
