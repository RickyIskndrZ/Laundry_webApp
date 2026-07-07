const { getDb } = require('../config/db');

const formatDateMySQL = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// =============================================
// LAPORAN PENJUALAN (Khusus Pimpinan)
// =============================================
const getSalesReport = async (req, res) => {
  const { start_date, end_date } = req.query;

  let query = `
    SELECT o.*, c.customer_name, c.phone, c.address 
    FROM trans_order o 
    LEFT JOIN customer c ON o.id_customer = c.id
  `;
  const params = [];
  const conditions = [];

  if (start_date) {
    conditions.push(`o.order_date >= ?`);
    params.push(formatDateMySQL(start_date));
  }
  if (end_date) {
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);
    conditions.push(`o.order_date <= ?`);
    params.push(formatDateMySQL(end));
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }
  query += ` ORDER BY o.order_date DESC`;

  try {
    const db = await getDb();
    
    const ordersRaw = await db.all(query, params);
    
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

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.order_status === 1).length;
    const pendingOrders = orders.filter(o => o.order_status === 0).length;

    // Reveneu per layanan
    const serviceRevenue = {};
    for (const order of orders) {
      for (const detail of order.order_details) {
        const svcName = detail.service.service_name;
        if (!serviceRevenue[svcName]) serviceRevenue[svcName] = { total: 0, count: 0 };
        serviceRevenue[svcName].total += Number(detail.subtotal);
        serviceRevenue[svcName].count += 1;
      }
    }

    // Revenue per hari (7 hari terakhir)
    const dailyRevenue = {};
    for (const order of orders) {
      const dateKey = new Date(order.order_date).toISOString().split('T')[0];
      if (!dailyRevenue[dateKey]) dailyRevenue[dateKey] = 0;
      dailyRevenue[dateKey] += Number(order.total);
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: { totalRevenue, totalOrders, completedOrders, pendingOrders },
        serviceRevenue,
        dailyRevenue,
        orders,
      },
    });
  } catch (error) {
    console.error('Report error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil laporan.' });
  }
};

// =============================================
// DASHBOARD STATS (Untuk semua yang login)
// =============================================
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const db = await getDb();

    const [
      totalOrdersRow,
      pendingOrdersRow,
      completedOrdersRow,
      todayOrdersRow,
      totalRevenueRow,
      totalCustomersRow,
    ] = await Promise.all([
      db.get(`SELECT COUNT(*) as count FROM trans_order`),
      db.get(`SELECT COUNT(*) as count FROM trans_order WHERE order_status = 0`),
      db.get(`SELECT COUNT(*) as count FROM trans_order WHERE order_status = 1`),
      db.get(`SELECT COUNT(*) as count FROM trans_order WHERE order_date >= ? AND order_date < ?`, [formatDateMySQL(today), formatDateMySQL(tomorrow)]),
      db.get(`SELECT SUM(total) as sum FROM trans_order`),
      db.get(`SELECT COUNT(*) as count FROM customer`),
    ]);

    // 7 transaksi terbaru
    const recentOrdersRaw = await db.all(`
      SELECT o.*, c.customer_name, c.phone, c.address 
      FROM trans_order o 
      LEFT JOIN customer c ON o.id_customer = c.id 
      ORDER BY o.created_at DESC 
      LIMIT 7
    `);

    const recentOrders = recentOrdersRaw.map(o => {
      const { customer_name, phone, address, ...orderData } = o;
      return {
        ...orderData,
        customer: {
          id: o.id_customer,
          customer_name,
          phone,
          address
        }
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalOrders: totalOrdersRow.count,
        pendingOrders: pendingOrdersRow.count,
        completedOrders: completedOrdersRow.count,
        todayOrders: todayOrdersRow.count,
        totalRevenue: Number(totalRevenueRow.sum) || 0,
        totalCustomers: totalCustomersRow.count,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard.' });
  }
};

module.exports = { getSalesReport, getDashboardStats };

