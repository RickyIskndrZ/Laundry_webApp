import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute, RoleRoute } from './components/auth/ProtectedRoute';
import ModernLayout from './components/layout/ModernLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransaksiPage from './pages/TransaksiPage';
import PickupPage from './pages/PickupPage';
import MasterCustomerPage from './pages/MasterCustomerPage';
import MasterServicePage from './pages/MasterServicePage';
import MasterUserPage from './pages/MasterUserPage';
import LaporanPage from './pages/LaporanPage';
import ArsipPage from './pages/ArsipPage';
import TrackingPage from './pages/TrackingPage';

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected — semua yang login */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ModernLayout>
                  <DashboardPage />
                </ModernLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin & Operator */}
          <Route
            path="/transaksi"
            element={
              <RoleRoute allowedLevels={[1, 2]}>
                <ModernLayout>
                  <TransaksiPage />
                </ModernLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/tracking"
            element={
              <RoleRoute allowedLevels={[1, 2]}>
                <ModernLayout>
                  <TrackingPage />
                </ModernLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/pickup"
            element={
              <RoleRoute allowedLevels={[1, 2]}>
                <ModernLayout>
                  <PickupPage />
                </ModernLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/master/customer"
            element={
              <RoleRoute allowedLevels={[1, 2]}>
                <ModernLayout>
                  <MasterCustomerPage />
                </ModernLayout>
              </RoleRoute>
            }
          />

          {/* Admin Only */}
          <Route
            path="/master/service"
            element={
              <RoleRoute allowedLevels={[1]}>
                <ModernLayout>
                  <MasterServicePage />
                </ModernLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/master/user"
            element={
              <RoleRoute allowedLevels={[1]}>
                <ModernLayout>
                  <MasterUserPage />
                </ModernLayout>
              </RoleRoute>
            }
          />

          {/* Admin & Pimpinan */}
          <Route
            path="/laporan"
            element={
              <RoleRoute allowedLevels={[1, 3]}>
                <ModernLayout>
                  <LaporanPage />
                </ModernLayout>
              </RoleRoute>
            }
          />
          <Route
            path="/arsip"
            element={
              <RoleRoute allowedLevels={[1, 2, 3]}>
                <ModernLayout>
                  <ArsipPage />
                </ModernLayout>
              </RoleRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
