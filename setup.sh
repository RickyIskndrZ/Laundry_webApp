#!/bin/bash
# ================================================
# LaundryPro - Setup Script
# ================================================
# Jalankan dengan: chmod +x setup.sh && ./setup.sh

echo "🚀 LaundryPro Setup Script"
echo "================================"

# Backend setup
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install

echo ""
echo "🗄️ Setting up database (Prisma DB Push)..."
npx prisma db push

echo ""
echo "🌱 Seeding initial data..."
node prisma/seed.js

echo ""
echo "================================"
echo "✅ Setup selesai!"
echo ""
echo "📋 Untuk menjalankan aplikasi:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "📋 Default Login Credentials:"
echo "   Admin     → admin@laundry.com / password123"
echo "   Operator  → operator@laundry.com / password123"
echo "   Pimpinan  → pimpinan@laundry.com / password123"
echo ""
echo "🔗 Frontend: http://localhost:5173"
echo "🔗 Backend:  http://localhost:5000"
