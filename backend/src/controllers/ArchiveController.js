const { getDb } = require('../config/db');

// =============================================
// GET SEMUA ARSIP PICKUP
// =============================================
const getAllArchives = async (req, res) => {
  try {
    const db = await getDb();
    const allPickupsRaw = await db.all(`
      SELECT p.*, o.order_code, o.order_date, o.order_status, o.total, c.customer_name, c.phone, u.name as user_name, u.email as user_email, u.id_level, l.level_name 
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

    const validArchivesRaw = allPickupsRaw.filter(a => !a.notes || !a.notes.startsWith('LOG_STATUS:'));

    const validArchives = validArchivesRaw.map(log => {
      const { order_code, order_date, order_status, total, customer_name, phone, user_name, user_email, id_level, level_name, ...pickupData } = log;
      
      return {
        ...pickupData,
        order: {
          id: pickupData.id_order,
          order_code,
          order_date,
          order_status,
          total,
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
        } : null
      };
    });

    return res.status(200).json({ success: true, data: validArchives });
  } catch (error) {
    console.error('Archive error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data arsip.' });
  }
};

// =============================================
// UNDO PICKUP (Kembalikan ke antrian)
// =============================================
const undoArchive = async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    const archive = await db.get(`
      SELECT p.*, o.order_code, o.order_status 
      FROM trans_laundry_pickup p
      JOIN trans_order o ON p.id_order = o.id
      WHERE p.id = ?
    `, [Number(id)]);

    if (!archive) {
      return res.status(404).json({ success: false, message: 'Arsip tidak ditemukan.' });
    }

    if (archive.order_status !== 5) {
      return res.status(400).json({ success: false, message: 'Order sudah dikembalikan sebelumnya atau berstatus tidak valid.' });
    }

    await db.run('BEGIN TRANSACTION');
    try {
      await db.run(`UPDATE trans_order SET order_status = 4, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [archive.id_order]);
      await db.run(`DELETE FROM trans_laundry_pickup WHERE id = ?`, [Number(id)]);
      await db.run('COMMIT');
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }

    return res.status(200).json({
      success: true,
      message: `Pickup untuk order ${archive.order_code} berhasil dibatalkan.`,
    });
  } catch (error) {
    console.error('Undo Archive error:', error);
    return res.status(500).json({ success: false, message: 'Gagal membatalkan pickup.' });
  }
};

// =============================================
// DELETE PERMANENT
// =============================================
const deletePermanentArchive = async (req, res) => {
  const { id } = req.params;

  try {
    const db = await getDb();
    const archive = await db.get(`SELECT * FROM trans_laundry_pickup WHERE id = ?`, [Number(id)]);

    if (!archive) {
      return res.status(404).json({ success: false, message: 'Arsip tidak ditemukan.' });
    }

    await db.run('BEGIN TRANSACTION');
    try {
      await db.run(`DELETE FROM trans_order_detail WHERE id_order = ?`, [archive.id_order]);
      await db.run(`DELETE FROM trans_laundry_pickup WHERE id = ?`, [Number(id)]);
      await db.run(`DELETE FROM trans_order WHERE id = ?`, [archive.id_order]);
      await db.run('COMMIT');
    } catch (e) {
      await db.run('ROLLBACK');
      throw e;
    }

    return res.status(200).json({
      success: true,
      message: 'Arsip dan transaksi berhasil dihapus secara permanen.',
    });
  } catch (error) {
    console.error('Delete Permanent Archive error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus arsip secara permanen.' });
  }
};

module.exports = { getAllArchives, undoArchive, deletePermanentArchive };

