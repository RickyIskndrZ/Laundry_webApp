import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

// Proteksi rute umum — perlu login
export const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Proteksi rute berdasarkan level
export const RoleRoute = ({ children, allowedLevels }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!allowedLevels.includes(user?.id_level)) {
    return <Navigate to="/" replace />;
  }
  return children;
};
