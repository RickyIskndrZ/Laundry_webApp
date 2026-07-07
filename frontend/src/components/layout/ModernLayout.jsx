import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, PackageCheck,
  Users, Settings, BarChart3, LogOut,
  ChevronLeft, ChevronRight, WashingMachine, Bell, Menu, X, Sun, Moon, Archive, Activity
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';

const navItems = [
  {
    group: 'UTAMA',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/', levels: [1, 2, 3] },
    ],
  },
  {
    group: 'TRANSAKSI',
    items: [
      { label: 'Transaksi Masuk', icon: ShoppingBag, to: '/transaksi', levels: [1, 2] },
      { label: 'Tracking Laundry', icon: Activity, to: '/tracking', levels: [1, 2] },
      { label: 'Pengambilan', icon: PackageCheck, to: '/pickup', levels: [1, 2] },
      { label: 'Arsip Keamanan', icon: Archive, to: '/arsip', levels: [1, 2, 3] },
    ],
  },
  {
    group: 'MASTER DATA',
    items: [
      { label: 'Pelanggan', icon: Users, to: '/master/customer', levels: [1, 2] },
      { label: 'Jenis Layanan', icon: Settings, to: '/master/service', levels: [1] },
      { label: 'Pengguna', icon: Users, to: '/master/user', levels: [1] },
    ],
  },
  {
    group: 'LAPORAN',
    items: [
      { label: 'Laporan Penjualan', icon: BarChart3, to: '/laporan', levels: [1, 3] },
    ],
  },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const levelBadge = {
    1: { label: 'Administrator', color: 'badge-blue' },
    2: { label: 'Operator', color: 'badge-cyan' },
    3: { label: 'Pimpinan', color: 'badge-pending' },
  };
  const badge = levelBadge[user?.id_level] || { label: 'User', color: 'badge-cyan' };

  return (
    <aside
      className="sidebar flex flex-col"
      style={{
        width: collapsed ? '72px' : '240px',
        transition: 'width 0.3s ease',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '20px 18px',
          borderBottom: '1px solid var(--color-border-subtle)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--color-gradient-primary-1), var(--color-gradient-primary-2))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 15px var(--color-shadow-glass)',
          }}
        >
          <WashingMachine size={20} color="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)', whiteSpace: 'nowrap' }}>
              Graha Laundry
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-accent)', opacity: 0.8, whiteSpace: 'nowrap', letterSpacing: '0.1em' }}>
              GRAHA AIKO KOST HOUSE
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 10px' }}>
        {navItems.map((group) => {
          const visibleItems = group.items.filter(item => item.levels.includes(user?.id_level));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group} style={{ marginBottom: '8px' }}>
              {!collapsed && (
                <div style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.12em',
                  padding: '8px 6px 6px',
                }}>
                  {group.group}
                </div>
              )}
              {visibleItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : undefined}
                  style={{ marginBottom: '2px', justifyContent: collapsed ? 'center' : 'flex-start' }}
                >
                  <item.icon size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--color-border-subtle)' }}>
        {!collapsed && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--color-bg-nav-hover)',
            border: '1px solid var(--color-border-subtle)',
            marginBottom: '8px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: 32, height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--color-gradient-primary-1), var(--color-gradient-primary-2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700, color: 'white',
              flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <span className={`badge ${badge.color}`} style={{ fontSize: '9.5px', padding: '2px 7px', marginTop: '2px' }}>
                {badge.label}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{
            width: '100%',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: 'rgba(248,113,113,0.7)',
          }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Keluar</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute',
          right: '-14px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'var(--color-bg-base)',
          border: '1px solid var(--color-border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--color-text-accent)',
          transition: 'all 0.2s ease',
          zIndex: 10,
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  );
};

const ModernLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-base)' }}>
      {/* Ambient background glow */}
      <div className="bg-glow-top" />

      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          marginLeft: collapsed ? '72px' : '240px',
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Top Header Bar */}
        <header
          style={{
            height: '60px',
            background: 'var(--color-bg-header)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button className="btn-icon" onClick={toggleTheme} style={{ color: 'var(--color-text-muted)' }} title={`Ganti ke mode ${theme === 'dark' ? 'Terang' : 'Gelap'}`}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button className="btn-icon" style={{ color: 'var(--color-text-muted)' }}>
              <Bell size={18} />
            </button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', borderRadius: '8px',
              background: 'var(--color-bg-nav-hover)',
              border: '1px solid var(--color-border-subtle)',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '6px',
                background: 'linear-gradient(135deg, var(--color-gradient-primary-1), var(--color-gradient-primary-2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: 'white',
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-sub)' }}>
                {user?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '28px 28px' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default ModernLayout;
