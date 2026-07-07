#!/bin/bash

# ==============================================================================
# Script Setup Laundry App untuk OS Windows (dengan XAMPP)
# ==============================================================================
# Script ini akan:
# 1. Mengecek ketersediaan MySQL dari XAMPP
# 2. Membuat database 'laundry_app'
# 3. Mengimport struktur tabel dari backend/schema.sql
# 4. Menginstall dependencies untuk backend dan membuat file .env
# 5. Menginstall dependencies untuk frontend
# ==============================================================================

echo "==========================================="
echo "  Mulai Setup Laundry App (Windows/XAMPP)  "
echo "==========================================="

# 1. Cek command mysql
MYSQL_CMD="mysql"

# Jika command mysql tidak ada di PATH, coba cari di folder default XAMPP
if ! command -v mysql &> /dev/null
then
    if [ -f "/c/xampp/mysql/bin/mysql.exe" ]; then
        MYSQL_CMD="/c/xampp/mysql/bin/mysql.exe"
    else
        echo "❌ Error: Command 'mysql' tidak ditemukan."
        echo "Pastikan XAMPP sudah terinstall dan module MySQL sedang berjalan."
        echo "Jika XAMPP terinstall di lokasi lain, tambahkan path bin mysql ke Environment Variables."
        exit 1
    fi
fi

echo -e "\n⏳ [1/4] Mengecek koneksi ke MySQL..."
if ! $MYSQL_CMD -u root -e "SELECT 1" &> /dev/null; then
    echo "❌ Error: Tidak dapat terhubung ke MySQL. Pastikan module MySQL di XAMPP sudah di-START."
    exit 1
else
    echo "✅ Berhasil terhubung ke MySQL."
fi

echo -e "\n⏳ [2/4] Setup Database 'laundry_app'..."
$MYSQL_CMD -u root -e "CREATE DATABASE IF NOT EXISTS laundry_app;"
if [ $? -eq 0 ]; then
    echo "✅ Database 'laundry_app' berhasil dibuat atau sudah ada."
else
    echo "❌ Error: Gagal membuat database."
    exit 1
fi

echo "   Mengimport schema dari backend/schema.sql..."
if [ -f "backend/schema.sql" ]; then
    $MYSQL_CMD -u root laundry_app < backend/schema.sql
    if [ $? -eq 0 ]; then
        echo "✅ Schema berhasil diimport ke database 'laundry_app'."
    else
        echo "❌ Error: Gagal mengimport schema."
        exit 1
    fi
else
    echo "❌ Error: File backend/schema.sql tidak ditemukan!"
    exit 1
fi

echo -e "\n⏳ [3/4] Setup Backend..."
if [ -d "backend" ]; then
    cd backend
    echo "   Menginstall NPM dependencies backend..."
    npm install

    # Membuat file .env jika belum ada
    if [ ! -f ".env" ]; then
        echo "   Membuat file .env untuk backend..."
        cat <<EOT > .env
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="laundry_app"
JWT_SECRET="laundry_super_secret_key_2024_secure"
JWT_EXPIRES_IN="8h"
PORT=5000
EOT
        echo "✅ File .env backend berhasil dibuat."
    else
        echo "✅ File backend/.env sudah ada (dilewati)."
    fi
    cd ..
else
    echo "❌ Error: Folder 'backend' tidak ditemukan!"
    exit 1
fi

echo -e "\n⏳ [4/4] Setup Frontend..."
if [ -d "frontend" ]; then
    cd frontend
    echo "   Menginstall NPM dependencies frontend..."
    npm install
    cd ..
    echo "✅ Setup frontend selesai."
else
    echo "❌ Error: Folder 'frontend' tidak ditemukan!"
    exit 1
fi

echo -e "\n==========================================="
echo " 🎉 SETUP SELESAI DENGAN SUKSES! 🎉"
echo "==========================================="
echo "Untuk menjalankan aplikasi, buka dua terminal baru:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "📋 Default Login Credentials:"
echo "   Admin     → admin@laundry.com / password123"
echo "   Operator  → operator@laundry.com / password123"
echo "   Pimpinan  → pimpinan@laundry.com / password123"
echo "==========================================="
echo "Semoga berhasil!"
