require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const mysql = require('mysql2/promise');
const path = require('path');

async function run() {
  console.log('Connecting to SQLite...');
  const sqliteDb = await open({
    filename: path.join(__dirname, 'dev.db'),
    driver: sqlite3.Database
  });

  console.log('Connecting to MySQL...');
  const mysqlPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laundry_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const tables = [
    'level',
    'user',
    'customer',
    'type_of_service',
    'trans_order',
    'trans_order_detail',
    'trans_laundry_pickup'
  ];

  for (const table of tables) {
    console.log(`Migrating table: ${table}...`);
    const rows = await sqliteDb.all(`SELECT * FROM ${table}`);
    if (rows.length === 0) {
      console.log(`  No data in ${table}`);
      continue;
    }

    for (const row of rows) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      
      // Convert Unix timestamp to MySQL DATETIME format string
      // Note: SQLite stores dates differently, sometimes as ISO strings, sometimes as integers.
      const values = columns.map(col => {
        let val = row[col];
        if ((col.endsWith('_at') || col.endsWith('_date')) && val) {
          if (typeof val === 'number') {
            // Prisma seeded unix timestamps
            val = new Date(val).toISOString().slice(0, 19).replace('T', ' ');
          } else if (typeof val === 'string') {
            // ISO strings like 2026-07-06T15:00:00.000Z
            val = new Date(val).toISOString().slice(0, 19).replace('T', ' ');
          }
        }
        return val;
      });

      const sql = `INSERT IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
      await mysqlPool.query(sql, values);
    }
    console.log(`  Migrated ${rows.length} rows for ${table}`);
  }

  console.log('Migration completed successfully!');
  await sqliteDb.close();
  await mysqlPool.end();
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
