const { getDb } = require('../config/db');

const STATUS_LABELS = {
  0: 'Diterima',
  1: 'Dicuci',
  2: 'Disetrika',
  3: 'Penimbangan',
  4: 'Selesai / Ready',
  5: 'Diambil',
};

const insertStatusLog = async (db, orderId, customerId, userId, statusCode) => {
  try {
    await db.run(
      `INSERT INTO trans_laundry_pickup (id_order, id_customer, id_user, pickup_date, notes, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [orderId, customerId, userId || null, `LOG_STATUS:${statusCode}`]
    );
  } catch (err) {
    console.error(`[insertStatusLog] Gagal membuat log untuk order ${orderId}:`, err);
  }
};

const generateOrderCode = async (db) => {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');

  const countObj = await db.get(`SELECT COUNT(*) as count FROM trans_order`);
  const seq = String(countObj.count + 1).padStart(4, '0');
  return `ORD-${dateStr}-${seq}`;
};

const getOrderWithRelations = async (db, id) => {
  const o = await db.get(`
    SELECT o.*, c.customer_name, c.phone, c.address 
    FROM trans_order o 
    LEFT JOIN customer c ON o.id_customer = c.id 
    WHERE o.id = ?`, [id]
  );
  if (!o) return null;

  const details = await db.all(`
    SELECT d.*, s.service_name, s.price, s.description 
    FROM trans_order_detail d 
    LEFT JOIN type_of_service s ON d.id_service = s.id 
    WHERE d.id_order = ?`, [id]
  );
  
  const pickups = await db.all(`SELECT * FROM trans_laundry_pickup WHERE id_order = ?`, [id]);

  return {
    ...o,
    customer: {
      id: o.id_customer,
      customer_name: o.customer_name,
      phone: o.phone,
      address: o.address
    },
    order_details: details.map(d => ({
      ...d,
      service: {
        id: d.id_service,
        service_name: d.service_name,
        price: d.price,
        description: d.description
      }
    })),
    laundry_pickups: pickups
  };
};

const createOrder = async (req, res) => {
  const { id_customer, order_date, order_end_date, details } = req.body;
  if (!id_customer || !details || !Array.isArray(details) || details.length === 0) {
    return res.status(400).json({ success: false, message: 'Data order tidak lengkap. Pilih pelanggan dan minimal satu layanan.' });
  }

  for (const d of details) {
    if (!d.id_service) {
      return res.status(400).json({ success: false, message: 'Setiap baris harus memiliki jenis layanan.' });
    }
  }

  try {
    const db = await getDb();
    const serviceIds = [...new Set(details.map(d => Number(d.id_service)))];
    const placeholders = serviceIds.map(() => '?').join(',');
    const services = await db.all(`SELECT id FROM type_of_service WHERE id IN (${placeholders})`, serviceIds);
    if (services.length !== serviceIds.length) {
      return res.status(400).json({ success: false, message: 'Satu atau lebih layanan tidak ditemukan.' });
    }

    const order_code = await generateOrderCode(db);

    await db.run('BEGIN TRANSACTION');
    try {
      const orderDate = order_date ? new Date(order_date).toISOString() : new Date().toISOString();
      const orderEndDate = order_end_date ? new Date(order_end_date).toISOString() : null;

      const orderResult = await db.run(
        `INSERT INTO trans_order (id_customer, order_code, order_date, order_end_date, order_status, total, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [Number(id_customer), order_code, orderDate, orderEndDate]
      );
      
      const orderId = orderResult.lastID;

      for (const d of details) {
        await db.run(
          `INSERT INTO trans_order_detail (id_order, id_service, qty, subtotal, notes, created_at, updated_at) VALUES (?, ?, 0, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [orderId, Number(d.id_service), d.notes || null]
        );
      }

      await insertStatusLog(db, orderId, Number(id_customer), req.user?.id_user, 0);

      await db.run('COMMIT');

      const order = await getOrderWithRelations(db, orderId);

      return res.status(201).json({
        success: true,
        message: `Order ${order_code} berhasil dibuat. Pakaian status: Diterima.`,
        data: order,
      });
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal membuat order.' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const db = await getDb();
    
    const ordersRaw = await db.all(`
      SELECT o.*, c.customer_name, c.phone, c.address 
      FROM trans_order o 
      LEFT JOIN customer c ON o.id_customer = c.id 
      ORDER BY o.created_at DESC
    `);
    
    const detailsRaw = await db.all(`
      SELECT d.*, s.service_name, s.price, s.description 
      FROM trans_order_detail d 
      LEFT JOIN type_of_service s ON d.id_service = s.id
    `);
    
    const pickupsRaw = await db.all(`SELECT * FROM trans_laundry_pickup`);
    
    const orders = ordersRaw.map(o => {
      const { customer_name, phone, address, ...orderData } = o;
      return {
        ...orderData,
        customer: {
          id: o.id_customer,
          customer_name,
          phone,
          address
        },
        order_details: detailsRaw.filter(d => d.id_order === o.id).map(d => ({
          ...d,
          service: {
            id: d.id_service,
            service_name: d.service_name,
            price: d.price,
            description: d.description
          }
        })),
        laundry_pickups: pickupsRaw.filter(p => p.id_order === o.id)
      };
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi.' });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    const order = await getOrderWithRelations(db, Number(id));
    if (!order) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal mengambil transaksi.' });
  }
};

const getStatusLogs = async (req, res) => {
  try {
    const db = await getDb();
    const allPickupsRaw = await db.all(`
      SELECT p.*, o.order_code, o.order_status, c.customer_name, c.phone, u.name as user_name, u.email as user_email, u.id_level, l.level_name 
      FROM trans_laundry_pickup p
      LEFT JOIN trans_order o ON p.id_order = o.id
      LEFT JOIN customer c ON p.id_customer = c.id
      LEFT JOIN user u ON p.id_user = u.id_user
      LEFT JOIN level l ON u.id_level = l.id_level
      ORDER BY p.pickup_date DESC
    `);
    
    const detailsRaw = await db.all(`
      SELECT d.*, s.service_name, s.price, s.description 
      FROM trans_order_detail d 
      LEFT JOIN type_of_service s ON d.id_service = s.id
    `);

    const logs = allPickupsRaw.filter(p => p.notes && p.notes.startsWith('LOG_STATUS:'));

    const enriched = logs.map(log => {
      const statusCode = log.notes?.replace('LOG_STATUS:', '') ?? '';
      const { order_code, order_status, customer_name, phone, user_name, user_email, id_level, level_name, ...pickupData } = log;
      
      return {
        ...pickupData,
        order: {
          id: pickupData.id_order,
          order_code,
          order_status,
          order_details: detailsRaw.filter(d => d.id_order === pickupData.id_order).map(d => ({
            ...d,
            service: {
              id: d.id_service,
              service_name: d.service_name,
              price: d.price,
              description: d.description
            }
          }))
        },
        customer: {
          id: pickupData.id_customer,
          customer_name,
          phone
        },
        user: pickupData.id_user ? {
          id_user: pickupData.id_user,
          name: user_name,
          email: user_email,
          level: { level_name }
        } : null,
        status_code: Number(statusCode),
        status_label: STATUS_LABELS[statusCode] ?? 'Tidak Diketahui',
      };
    });

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('Get status logs error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil log status.' });
  }
};

const clearStatusLogs = async (req, res) => {
  try {
    const db = await getDb();
    const allPickups = await db.all(`SELECT id, notes FROM trans_laundry_pickup`);
    const logIds = allPickups.filter(p => p.notes && p.notes.startsWith('LOG_STATUS:')).map(p => p.id);

    if (logIds.length > 0) {
      const placeholders = logIds.map(() => '?').join(',');
      await db.run(`DELETE FROM trans_laundry_pickup WHERE id IN (${placeholders})`, logIds);
    }
    return res.status(200).json({ success: true, message: 'Semua riwayat status berhasil dibersihkan.' });
  } catch (error) {
    console.error('Clear status logs error:', error);
    return res.status(500).json({ success: false, message: 'Gagal membersihkan riwayat status.' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    const order = await db.get(`SELECT * FROM trans_order WHERE id = ?`, [Number(id)]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    }

    const allowedTransitions = { 0: 1, 1: 2, 2: 3 };
    const nextStatus = allowedTransitions[order.order_status];

    if (nextStatus === undefined) {
      return res.status(400).json({
        success: false,
        message: `Status "${STATUS_LABELS[order.order_status]}" tidak dapat diubah melalui endpoint ini.`,
      });
    }

    await db.run(`UPDATE trans_order SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [nextStatus, Number(id)]);
    await insertStatusLog(db, order.id, order.id_customer, req.user?.id_user, nextStatus);

    const updatedOrder = await getOrderWithRelations(db, Number(id));

    return res.status(200).json({
      success: true,
      message: `Order ${order.order_code} berhasil diubah ke status: ${STATUS_LABELS[nextStatus]}.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui status.' });
  }
};

const weighOnly = async (req, res) => {
  const { id } = req.params;
  const { details, order_end_date } = req.body;

  if (!details || !Array.isArray(details) || details.length === 0) {
    return res.status(400).json({ success: false, message: 'Data berat pakaian tidak lengkap.' });
  }

  try {
    const db = await getDb();
    const order = await getOrderWithRelations(db, Number(id));

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });
    }

    let totalBiaya = 0;
    const detailUpdates = [];

    for (const input of details) {
      const detail = order.order_details.find(d => d.id === Number(input.id));
      if (!detail) {
        return res.status(400).json({ success: false, message: `Detail ID ${input.id} tidak ditemukan pada order ini.` });
      }
      const qty = Number(input.qty);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: `Berat untuk layanan "${detail.service.service_name}" harus lebih dari 0 kg.` });
      }
      const subtotal = Number(detail.service.price) * qty;
      totalBiaya += subtotal;
      detailUpdates.push({ id: detail.id, qty, subtotal });
    }

    const order_change = order.order_pay ? Number(order.order_pay) - totalBiaya : null;
    const orderEndDate = order_end_date ? new Date(order_end_date).toISOString() : order.order_end_date;

    await db.run('BEGIN TRANSACTION');
    try {
      for (const du of detailUpdates) {
        await db.run(`UPDATE trans_order_detail SET qty = ?, subtotal = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [du.qty, du.subtotal, du.id]);
      }
      await db.run(
        `UPDATE trans_order SET order_status = 4, total = ?, order_change = ?, order_end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [totalBiaya, order_change, orderEndDate, Number(id)]
      );
      await insertStatusLog(db, order.id, order.id_customer, req.user?.id_user, 4);
      await db.run('COMMIT');
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }

    const updatedOrder = await getOrderWithRelations(db, Number(id));

    return res.status(200).json({
      success: true,
      message: `Order ${order.order_code} selesai ditimbang. Total: Rp ${totalBiaya.toLocaleString('id-ID')}. Status: Selesai / Ready.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Weigh error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Gagal memproses penimbangan.' });
  }
};

const payOrder = async (req, res) => {
  const { id } = req.params;
  const { order_pay, tax_pct } = req.body;

  if (order_pay === undefined || order_pay === null) {
    return res.status(400).json({ success: false, message: 'Nominal pembayaran harus diisi.' });
  }

  try {
    const db = await getDb();
    const order = await db.get(`SELECT * FROM trans_order WHERE id = ?`, [Number(id)]);

    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });

    if (order.order_status !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Pembayaran hanya bisa dilakukan pada order berstatus Selesai/Ready.',
      });
    }

    // Hitung ulang base total dari detail agar tidak double tax jika dipanggil berulang
    const details = await db.all(`SELECT subtotal FROM trans_order_detail WHERE id_order = ?`, [Number(id)]);
    const baseTotal = details.reduce((sum, d) => sum + Number(d.subtotal), 0);
    
    const taxValue = tax_pct !== undefined ? Number(tax_pct) : 10;
    const taxAmount = (baseTotal * taxValue) / 100;
    const grandTotal = baseTotal + taxAmount;

    const order_change = Number(order_pay) - grandTotal;

    await db.run(
      `UPDATE trans_order SET total = ?, order_pay = ?, order_change = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [grandTotal, Number(order_pay), order_change, Number(id)]
    );

    const updatedOrder = await getOrderWithRelations(db, Number(id));

    return res.status(200).json({
      success: true,
      message: `Pembayaran sebesar Rp ${Number(order_pay).toLocaleString('id-ID')} berhasil dicatat.`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Payment error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses pembayaran.' });
  }
};

const cancelPayment = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    const order = await db.get(`SELECT * FROM trans_order WHERE id = ?`, [Number(id)]);

    if (!order) return res.status(404).json({ success: false, message: 'Order tidak ditemukan.' });

    if (order.order_status !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Pembatalan pembayaran hanya bisa dilakukan pada order berstatus Selesai/Ready.',
      });
    }

    // Kembalikan total ke base total saat batal lunas (hapus tax)
    const details = await db.all(`SELECT subtotal FROM trans_order_detail WHERE id_order = ?`, [Number(id)]);
    const baseTotal = details.reduce((sum, d) => sum + Number(d.subtotal), 0);

    await db.run(
      `UPDATE trans_order SET total = ?, order_pay = NULL, order_change = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [baseTotal, Number(id)]
    );

    const updatedOrder = await getOrderWithRelations(db, Number(id));

    return res.status(200).json({
      success: true,
      message: 'Pembayaran berhasil dibatalkan (Batal Lunas).',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Cancel Payment error:', error);
    return res.status(500).json({ success: false, message: 'Gagal membatalkan pembayaran.' });
  }
};

const processPickup = async (req, res) => {
  const { id } = req.params;
  const { notes, pickup_date } = req.body;

  try {
    const db = await getDb();
    const order = await db.get(`SELECT * FROM trans_order WHERE id = ?`, [Number(id)]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
    }

    if (order.order_status === 5) {
      return res.status(409).json({ success: false, message: 'Transaksi ini sudah diambil sebelumnya.' });
    }

    if (order.order_status !== 4) {
      return res.status(400).json({
        success: false,
        message: `Pickup hanya bisa dilakukan pada order berstatus "Selesai / Ready". Status saat ini: ${STATUS_LABELS[order.order_status]}.`,
      });
    }

    const total = Number(order.total);
    const paid = Number(order.order_pay || 0);
    if (total > 0 && paid < total) {
      return res.status(400).json({
        success: false,
        message: `Pembayaran belum lunas. Sisa tagihan: Rp ${(total - paid).toLocaleString('id-ID')}. Selesaikan pembayaran terlebih dahulu.`,
      });
    }

    await db.run('BEGIN TRANSACTION');
    let pickupResult;
    try {
      await db.run(`UPDATE trans_order SET order_status = 5, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [Number(id)]);
      
      const finalPickupDate = pickup_date ? new Date(pickup_date).toISOString() : null;
      pickupResult = await db.run(
        `INSERT INTO trans_laundry_pickup (id_order, id_customer, id_user, pickup_date, notes, created_at, updated_at) VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [Number(id), order.id_customer, req.user.id_user, finalPickupDate, notes || null]
      );
      await insertStatusLog(db, order.id, order.id_customer, req.user?.id_user, 5);
      await db.run('COMMIT');
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }

    const updatedOrder = await getOrderWithRelations(db, Number(id));
    const pickup = await db.get(`SELECT * FROM trans_laundry_pickup WHERE id = ?`, [pickupResult.lastID]);

    return res.status(200).json({
      success: true,
      message: `Pickup untuk order ${order.order_code} berhasil dicatat.`,
      data: { order: updatedOrder, pickup },
    });
  } catch (error) {
    console.error('Pickup error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses pickup.' });
  }
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    try {
      await db.run(`DELETE FROM trans_laundry_pickup WHERE id_order = ?`, [Number(id)]);
      await db.run(`DELETE FROM trans_order_detail WHERE id_order = ?`, [Number(id)]);
      await db.run(`DELETE FROM trans_order WHERE id = ?`, [Number(id)]);
      await db.run('COMMIT');
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }
    return res.status(200).json({ success: true, message: 'Transaksi berhasil dihapus.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal menghapus transaksi.' });
  }
};

module.exports = {
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
};
