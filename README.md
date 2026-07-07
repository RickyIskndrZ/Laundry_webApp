# Laundry_webApp

File `migrate.js` adalah sebuah skrip otomatis (jembatan) yang secara khusus saya rancang untuk menyelamatkan dan memindahkan seluruh data Anda dari _database_ lama (SQLite) ke _database_ baru (MySQL) agar tidak ada data yang hilang selama proses pergantian teknologi.

Secara teknis, fungsi spesifik dari `migrate.js` meliputi:

1. **Membuka Koneksi ke Dua Database Sekaligus:**
   Skrip ini secara cerdas membaca file lokal `dev.db` menggunakan _driver_ SQLite, dan pada saat yang bersamaan membuka koneksi ke _server_ MySQL menggunakan kredensial dari file `.env`.

2. **Menyalin Data Tabel per Tabel (_Looping_):**
   Ia mendeteksi 7 tabel utama di sistem (`level`, `user`, `customer`, `type_of_service`, `trans_order`, `trans_order_detail`, dan `trans_laundry_pickup`). Kemudian, ia akan menyeleksi seluruh baris data yang ada di tabel SQLite, lalu membuat perintah `INSERT` untuk memasukkannya ke tabel yang sama di MySQL.

3. **Penyesuaian Format Waktu (_Timestamp Parsing_):**
   Ini adalah fungsi paling krusial. Pada _database_ lama Anda (karena riwayat penggunaan Prisma sebelumnya), beberapa tanggal dan waktu direkam menggunakan deretan angka milidetik (_Unix Timestamp_, misal: `1783062963071`). Format ini akan ditolak oleh MySQL yang menuntut format `DATETIME` yang baku (misal: `YYYY-MM-DD HH:MM:SS`). Skrip `migrate.js` akan mendeteksi setiap kolom yang berakhiran `_at` atau `_date`, mengubah angka-angka tersebut menjadi format waktu yang bisa dibaca dan disetujui oleh MySQL.

4. **Menutup Koneksi dengan Aman:**
   Setelah proses penyalinan selesai, ia akan melaporkan jumlah baris yang berhasil dipindahkan untuk masing-masing tabel (seperti yang Anda lihat pada keluaran terminal sebelumnya), lalu menutup koneksi ke kedua _database_ tersebut secara rapi.

Kini setelah migrasi berhasil 100%, file `migrate.js` ini (bersama dengan `dev.db`) sebenarnya sudah menyelesaikan tugasnya dan bisa Anda biarkan saja sebagai dokumentasi atau dihapus jika Anda menginginkan _folder_ proyek yang lebih bersih.
