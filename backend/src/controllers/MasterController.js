const { getDb } = require('../config/db');
const bcrypt = require('bcryptjs');

// =============================================
// CUSTOMER CONTROLLER
// =============================================

const getAllCustomers = async (req, res) => {
  try {
    const db = await getDb();
    const customers = await db.all(`SELECT * FROM customer ORDER BY created_at DESC`);
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pelanggan.' });
  }
};

const getCustomerById = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    const customer = await db.get(`SELECT * FROM customer WHERE id = ?`, [Number(id)]);
    if (!customer) return res.status(404).json({ success: false, message: 'Pelanggan tidak ditemukan.' });
    return res.status(200).json({ success: true, data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pelanggan.' });
  }
};

const createCustomer = async (req, res) => {
  const { customer_name, phone, address } = req.body;
  if (!customer_name || !phone || !address) {
    return res.status(400).json({ success: false, message: 'Nama, telepon, dan alamat wajib diisi.' });
  }
  try {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO customer (customer_name, phone, address, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [customer_name, phone, address]
    );
    const customer = await db.get(`SELECT * FROM customer WHERE id = ?`, [result.lastID]);
    return res.status(201).json({ success: true, message: 'Pelanggan berhasil ditambahkan.', data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menambahkan pelanggan.' });
  }
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { customer_name, phone, address } = req.body;
  try {
    const db = await getDb();
    await db.run(
      `UPDATE customer SET customer_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [customer_name, phone, address, Number(id)]
    );
    const customer = await db.get(`SELECT * FROM customer WHERE id = ?`, [Number(id)]);
    return res.status(200).json({ success: true, message: 'Pelanggan berhasil diperbarui.', data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pelanggan.' });
  }
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.run(`DELETE FROM customer WHERE id = ?`, [Number(id)]);
    return res.status(200).json({ success: true, message: 'Pelanggan berhasil dihapus.' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        success: false,
        message: 'Pelanggan tidak bisa dihapus karena masih memiliki riwayat transaksi.',
      });
    }
    return res.status(500).json({ success: false, message: 'Gagal menghapus pelanggan.' });
  }
};

// =============================================
// USER CONTROLLER
// =============================================

const getAllUsers = async (req, res) => {
  try {
    const db = await getDb();
    const usersRaw = await db.all(`
      SELECT u.id_user, u.id_level, u.name, u.email, u.created_at, u.updated_at, l.level_name 
      FROM user u 
      JOIN level l ON u.id_level = l.id_level 
      ORDER BY u.created_at DESC
    `);
    
    const safeUsers = usersRaw.map(u => ({
      id_user: u.id_user,
      id_level: u.id_level,
      name: u.name,
      email: u.email,
      created_at: u.created_at,
      updated_at: u.updated_at,
      level: {
        id_level: u.id_level,
        level_name: u.level_name
      }
    }));
    return res.status(200).json({ success: true, data: safeUsers });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.' });
  }
};

const createUser = async (req, res) => {
  const { id_level, name, email, password } = req.body;
  if (!id_level || !name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
  }
  try {
    const db = await getDb();
    const existing = await db.get(`SELECT email FROM user WHERE email = ?`, [email]);
    if (existing) return res.status(409).json({ success: false, message: 'Email sudah digunakan.' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.run(
      `INSERT INTO user (id_level, name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [Number(id_level), name, email, hashed]
    );
    
    const userRow = await db.get(`
      SELECT u.id_user, u.id_level, u.name, u.email, u.created_at, u.updated_at, l.level_name 
      FROM user u 
      JOIN level l ON u.id_level = l.id_level 
      WHERE u.id_user = ?
    `, [result.lastID]);

    const safeUser = {
      id_user: userRow.id_user,
      id_level: userRow.id_level,
      name: userRow.name,
      email: userRow.email,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
      level: {
        id_level: userRow.id_level,
        level_name: userRow.level_name
      }
    };
    return res.status(201).json({ success: true, message: 'Pengguna berhasil ditambahkan.', data: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menambahkan pengguna.' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { id_level, name, email, password } = req.body;
  try {
    const db = await getDb();
    
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.run(
        `UPDATE user SET id_level = ?, name = ?, email = ?, password = ?, updated_at = CURRENT_TIMESTAMP WHERE id_user = ?`,
        [Number(id_level), name, email, hashed, Number(id)]
      );
    } else {
      await db.run(
        `UPDATE user SET id_level = ?, name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id_user = ?`,
        [Number(id_level), name, email, Number(id)]
      );
    }

    const userRow = await db.get(`
      SELECT u.id_user, u.id_level, u.name, u.email, u.created_at, u.updated_at, l.level_name 
      FROM user u 
      JOIN level l ON u.id_level = l.id_level 
      WHERE u.id_user = ?
    `, [Number(id)]);

    const safeUser = {
      id_user: userRow.id_user,
      id_level: userRow.id_level,
      name: userRow.name,
      email: userRow.email,
      created_at: userRow.created_at,
      updated_at: userRow.updated_at,
      level: {
        id_level: userRow.id_level,
        level_name: userRow.level_name
      }
    };
    return res.status(200).json({ success: true, message: 'Pengguna berhasil diperbarui.', data: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pengguna.' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.run(`DELETE FROM user WHERE id_user = ?`, [Number(id)]);
    return res.status(200).json({ success: true, message: 'Pengguna berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus pengguna.' });
  }
};

// =============================================
// TYPE OF SERVICE CONTROLLER
// =============================================

const getAllServices = async (req, res) => {
  try {
    const db = await getDb();
    const services = await db.all(`SELECT * FROM type_of_service ORDER BY id ASC`);
    return res.status(200).json({ success: true, data: services });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data layanan.' });
  }
};

const createService = async (req, res) => {
  const { service_name, price, description } = req.body;
  if (!service_name || !price) {
    return res.status(400).json({ success: false, message: 'Nama layanan dan harga wajib diisi.' });
  }
  try {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO type_of_service (service_name, price, description, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [service_name, Number(price), description || null]
    );
    const service = await db.get(`SELECT * FROM type_of_service WHERE id = ?`, [result.lastID]);
    return res.status(201).json({ success: true, message: 'Layanan berhasil ditambahkan.', data: service });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menambahkan layanan.' });
  }
};

const updateService = async (req, res) => {
  const { id } = req.params;
  const { service_name, price, description } = req.body;
  try {
    const db = await getDb();
    await db.run(
      `UPDATE type_of_service SET service_name = ?, price = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [service_name, Number(price), description || null, Number(id)]
    );
    const service = await db.get(`SELECT * FROM type_of_service WHERE id = ?`, [Number(id)]);
    return res.status(200).json({ success: true, message: 'Layanan berhasil diperbarui.', data: service });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal memperbarui layanan.' });
  }
};

const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.run(`DELETE FROM type_of_service WHERE id = ?`, [Number(id)]);
    return res.status(200).json({ success: true, message: 'Layanan berhasil dihapus.' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        success: false,
        message: 'Jenis layanan tidak bisa dihapus karena masih digunakan pada riwayat transaksi.',
      });
    }
    return res.status(500).json({ success: false, message: 'Gagal menghapus layanan.' });
  }
};

// =============================================
// LEVELS CONTROLLER
// =============================================

const getAllLevels = async (req, res) => {
  try {
    const db = await getDb();
    const levels = await db.all(`SELECT * FROM level ORDER BY id_level ASC`);
    return res.status(200).json({ success: true, data: levels });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data level.' });
  }
};

module.exports = {
  getAllCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer,
  getAllUsers, createUser, updateUser, deleteUser,
  getAllServices, createService, updateService, deleteService,
  getAllLevels,
};
