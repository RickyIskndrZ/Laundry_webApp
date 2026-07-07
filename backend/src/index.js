require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/master');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const archiveRoutes = require('./routes/archiveRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// ROUTES
// =============================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Laundry API Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      master: '/api/master',
      orders: '/api/orders',
      reports: '/api/reports',
      archives: '/api/archives',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/archives', archiveRoutes);

// =============================================
// 404 HANDLER
// =============================================
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// =============================================
// GLOBAL ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server.' });
});

// =============================================
// START SERVER
// =============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Laundry API Server berjalan di http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, '//***@')}\n`);
});

module.exports = app;
