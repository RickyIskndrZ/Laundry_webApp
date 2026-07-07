import { useEffect, useState } from 'react';
import {
  ShoppingBag, PackageCheck, Users, TrendingUp,
  Clock, CheckCircle, AlertCircle, ArrowRight, RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/authStore';

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const KPICard = ({ label, value, icon: Icon, colorClass, sub }) => (
  <div className={`glass-card glass-card-hover ${colorClass}`} style={{ padding: '22px', borderRadius: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '8px', letterSpacing: '0.04em' }}>
          {label}
        </p>
        <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-text-main)', lineHeight: 1 }}>
          {value}
        </p>
        {sub && <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '6px' }}>{sub}</p>}
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: '12px',
        background: 'var(--color-btn-icon-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={22} style={{ color: 'var(--color-text-muted)' }} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => (
  status === 0
    ? <span className="badge badge-pending"><Clock size={10} /> Baru</span>
    : <span className="badge badge-done"><CheckCircle size={10} /> Diambil</span>
);

const DashboardPage = () => {
  const { user, isAdminOrOperator } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-main)', marginBottom: '6px' }}>
            {greeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--color-text-muted)' }}>
            Berikut ringkasan operasional laundry hari ini.
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchStats} style={{ gap: '7px' }}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <KPICard label="TOTAL TRANSAKSI" value={stats?.totalOrders ?? 0} icon={ShoppingBag} colorClass="kpi-blue" sub="Semua waktu" />
          <KPICard label="ANTRIAN (BARU)" value={stats?.pendingOrders ?? 0} icon={AlertCircle} colorClass="kpi-amber" sub="Belum diambil" />
          <KPICard label="SELESAI (DIAMBIL)" value={stats?.completedOrders ?? 0} icon={PackageCheck} colorClass="kpi-green" sub="Sudah diambil" />
          <KPICard label="HARI INI" value={stats?.todayOrders ?? 0} icon={TrendingUp} colorClass="kpi-cyan" sub="Transaksi masuk" />
          <KPICard
            label="TOTAL PELANGGAN"
            value={stats?.totalCustomers ?? 0}
            icon={Users}
            colorClass="kpi-blue"
            sub="Terdaftar"
          />
          <KPICard
            label="TOTAL PENDAPATAN"
            value={formatRupiah(stats?.totalRevenue ?? 0)}
            icon={TrendingUp}
            colorClass="kpi-green"
            sub="Semua waktu"
          />
        </div>
      )}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* Recent Orders */}
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>Transaksi Terbaru</h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>7 transaksi terakhir</p>
            </div>
            <Link to="/transaksi" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: 'var(--color-text-accent)', textDecoration: 'none' }}>
              Lihat semua <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '20px' }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '8px', marginBottom: '8px' }} />)}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode Order</th>
                    <th>Pelanggan</th>
                    <th>Total</th>
                    <th>Tgl Order</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentOrders?.length > 0 ? stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <span className="badge badge-blue" style={{ fontFamily: 'monospace' }}>
                          {order.order_code}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{order.customer?.customer_name}</td>
                      <td style={{ color: 'var(--color-text-accent)', fontWeight: 600 }}>{formatRupiah(order.total)}</td>
                      <td>{new Date(order.order_date).toLocaleDateString('id-ID')}</td>
                      <td><StatusBadge status={order.order_status} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <ShoppingBag size={32} style={{ opacity: 0.3 }} />
                          <span>Belum ada transaksi</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Actions Card */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '14px' }}>
              Aksi Cepat
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isAdminOrOperator() && (
                <Link to="/transaksi" className="btn-primary" style={{ justifyContent: 'flex-start', gap: '10px' }}>
                  <ShoppingBag size={16} /> Transaksi Baru
                </Link>
              )}
              {isAdminOrOperator() && (
                <Link to="/pickup" className="btn-secondary" style={{ justifyContent: 'flex-start', gap: '10px' }}>
                  <PackageCheck size={16} /> Proses Pickup
                </Link>
              )}
              {isAdminOrOperator() && (
                <Link to="/master/customer" className="btn-secondary" style={{ justifyContent: 'flex-start', gap: '10px' }}>
                  <Users size={16} /> Tambah Pelanggan
                </Link>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '14px' }}>
              Info Sistem
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Role', value: user?.level_name || '-' },
                { label: 'Login sebagai', value: user?.email || '-' },
                { label: 'Versi', value: 'LaundryPro v1.0' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>{item.label}</span>
                  <span style={{ fontSize: '12.5px', color: 'var(--color-text-sub)', fontWeight: 500 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
