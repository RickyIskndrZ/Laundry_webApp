const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, '../../dev.db'),
      driver: sqlite3.Database
    }).then(async (db) => {
      // Aktifkan foreign keys setiap kali koneksi dibuka
      await db.exec('PRAGMA foreign_keys = ON;');
      return db;
    });
  }
  return dbPromise;
}

module.exports = { getDb };
