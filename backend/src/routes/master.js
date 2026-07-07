const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer,
  getAllUsers, createUser, updateUser, deleteUser,
  getAllServices, createService, updateService, deleteService,
  getAllLevels,
} = require('../controllers/MasterController');

// Semua route di sini perlu token
router.use(verifyToken);

// ---- CUSTOMERS (Admin & Operator bisa manage) ----
router.get('/customers', getAllCustomers);
router.get('/customers/:id', getCustomerById);
router.post('/customers', requireRole(1, 2), createCustomer);
router.put('/customers/:id', requireRole(1, 2), updateCustomer);
router.delete('/customers/:id', requireRole(1), deleteCustomer);

// ---- USERS (Admin only) ----
router.get('/users', requireRole(1), getAllUsers);
router.post('/users', requireRole(1), createUser);
router.put('/users/:id', requireRole(1), updateUser);
router.delete('/users/:id', requireRole(1), deleteUser);

// ---- SERVICES (Admin bisa ubah, semua bisa lihat) ----
router.get('/services', getAllServices);
router.post('/services', requireRole(1), createService);
router.put('/services/:id', requireRole(1), updateService);
router.delete('/services/:id', requireRole(1), deleteService);

// ---- LEVELS ----
router.get('/levels', getAllLevels);

module.exports = router;
