const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

async function getDb() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'laundry_app',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  // To support transactions securely without rewriting everything heavily,
  // we return an object that acts like the old sqlite `db` object.
  // It handles BEGIN TRANSACTION by acquiring a dedicated connection.
  
  let txConn = null;

  const executeWithConn = async (sql, params, isRun = false) => {
    const conn = txConn || pool;
    try {
      const [result] = await conn.query(sql, params);
      if (isRun) {
        return { lastID: result.insertId, changes: result.affectedRows };
      }
      return result;
    } catch (error) {
      throw error;
    }
  };

  return {
    async get(sql, params = []) {
      const rows = await executeWithConn(sql, params);
      return rows[0] || null;
    },
    async all(sql, params = []) {
      const rows = await executeWithConn(sql, params);
      return rows;
    },
    async run(sql, params = []) {
      if (sql.trim().toUpperCase() === 'BEGIN TRANSACTION') {
        if (!txConn) {
          txConn = await pool.getConnection();
          await txConn.beginTransaction();
        }
        return { lastID: 0, changes: 0 };
      }
      if (sql.trim().toUpperCase() === 'COMMIT') {
        if (txConn) {
          await txConn.commit();
          txConn.release();
          txConn = null;
        }
        return { lastID: 0, changes: 0 };
      }
      if (sql.trim().toUpperCase() === 'ROLLBACK') {
        if (txConn) {
          await txConn.rollback();
          txConn.release();
          txConn = null;
        }
        return { lastID: 0, changes: 0 };
      }
      return executeWithConn(sql, params, true);
    },
    async exec(sql) {
      if (sql.includes('PRAGMA foreign_keys = ON')) return; // Ignore SQLite specific pragmas
      await executeWithConn(sql, []);
    },
    // Adding a manual release just in case, though COMMIT/ROLLBACK handles it
    release() {
      if (txConn) {
        txConn.release();
        txConn = null;
      }
    }
  };
}

module.exports = { getDb };

