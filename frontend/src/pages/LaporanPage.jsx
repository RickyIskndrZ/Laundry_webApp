import { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Calendar, RefreshCw,
  ShoppingBag, PackageCheck, AlertCircle, DollarSign,
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const LaporanPage = () => {
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const res = await api.get(`/reports/sales?${params}`);
      setReport(res.data.data);
    } catch {
      toast.error('Gagal memuat laporan.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []);

  const serviceRevenue = report ? Object.entries(report.serviceRevenue).sort((a, b) => b[1].total - a[1].total) : [];
  const [chartView, setChartView] = useState('daily'); // 'daily', 'monthly', 'yearly'

  let chartData = [];
  if (report?.orders) {
    const grouped = {};
    for (const order of report.orders) {
      const date = new Date(order.order_date);
      let key, label;
      if (chartView === 'daily') {
        key = date.toISOString().split('T')[0];
        label = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
      } else if (chartView === 'monthly') {
        key = date.toISOString().substring(0, 7);
        label = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      } else {
        key = date.toISOString().substring(0, 4);
        label = date.getFullYear().toString();
      }
      
      if (!grouped[key]) grouped[key] = { value: 0, label };
      grouped[key].value += Number(order.total);
    }
    
    chartData = Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(chartView === 'daily' ? -14 : chartView === 'monthly' ? -12 : -5)
      .map(([key, data]) => ({ key, label: data.label, revenue: data.value }));
  }

  const maxChart = chartData.length > 0 ? Math.max(...chartData.map(d => d.revenue)) : 1;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>Laporan Penjualan</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Pantau performa bisnis laundry secara menyeluruh
          </p>
        </div>
        {/* Date Filter */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
            <input type="date" className="form-input" value={startDate}
              onChange={e => setStartDate(e.target.value)} style={{ width: '150px', padding: '9px 12px' }} id="report-start" />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>s/d</span>
            <input type="date" className="form-input" value={endDate}
              onChange={e => setEndDate(e.target.value)} style={{ width: '150px', padding: '9px 12px' }} id="report-end" />
          </div>
          <button className="btn-primary" onClick={fetchReport} disabled={loading} id="btn-filter-report">
            <RefreshCw size={14} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
            {loading ? 'Memuat...' : 'Terapkan'}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Pendapatan', value: formatRupiah(report?.summary.totalRevenue), icon: DollarSign, color: 'kpi-green' },
          { label: 'Total Transaksi', value: report?.summary.totalOrders ?? '—', icon: ShoppingBag, color: 'kpi-blue' },
          { label: 'Sudah Diambil', value: report?.summary.completedOrders ?? '—', icon: PackageCheck, color: 'kpi-cyan' },
          { label: 'Menunggu Pickup', value: report?.summary.pendingOrders ?? '—', icon: AlertCircle, color: 'kpi-amber' },
        ].map(card => (
          <div key={card.label} className={`glass-card ${card.color}`} style={{ padding: '20px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '7px', letterSpacing: '0.06em' }}>
                  {card.label.toUpperCase()}
                </p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  {loading ? '...' : card.value}
                </p>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: '10px',
                background: 'var(--color-btn-icon-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <card.icon size={19} style={{ color: 'var(--color-text-muted)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>
        {/* Revenue Chart (Bar) */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={17} style={{ color: 'var(--color-text-accent)' }} />
              Grafik Pendapatan
            </h2>
            <select 
              className="form-input" 
              style={{ width: 'auto', padding: '6px 12px', fontSize: '12.5px', borderRadius: '8px' }}
              value={chartView}
              onChange={(e) => setChartView(e.target.value)}
            >
              <option value="daily">Harian</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: '200px', borderRadius: '10px' }} />
          ) : chartData.length > 0 ? (
            <div style={{ overflowX: 'auto', paddingBottom: '15px' }}>
              <div style={{ position: 'relative', minWidth: '400px', height: '210px', marginTop: '20px' }}>
                {/* SVG for Line and Area */}
                <svg viewBox="0 0 1000 150" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '150px', overflow: 'visible' }} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-gradient-primary-1)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--color-gradient-primary-1)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const maxIndex = Math.max(chartData.length - 1, 1);
                    const getX = (i) => chartData.length === 1 ? 500 : (i / maxIndex) * 1000;
                    
                    const points = chartData.map((d, i) => {
                      const x = getX(i);
                      const y = 150 - (d.revenue / maxChart) * 120 - 15;
                      return `${x},${y}`;
                    }).join(' ');
                    
                    const areaPoints = `0,150 ${points} 1000,150`;
                      
                    return (
                      <>
                        {chartData.length > 1 && <polygon points={areaPoints} fill="url(#lineGradient)" />}
                        {chartData.length > 1 && <polyline points={points} fill="none" stroke="var(--color-gradient-primary-1)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />}
                      </>
                    );
                  })()}
                </svg>

                {/* Overlays for Labels and Dots */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '150px' }}>
                  {chartData.map((d, i) => {
                    const maxIndex = Math.max(chartData.length - 1, 1);
                    const leftPct = chartData.length === 1 ? 50 : (i / maxIndex) * 100;
                    const topPx = 150 - (d.revenue / maxChart) * 120 - 15;

                    return (
                      <div key={d.key} style={{ position: 'absolute', left: `${leftPct}%`, top: `${topPx}px`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                        <div style={{
                          width: '12px', height: '12px',
                          background: 'var(--color-bg-main)',
                          border: '2.5px solid var(--color-gradient-primary-1)',
                          borderRadius: '50%',
                          boxShadow: '0 0 5px var(--color-shadow-glass)',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                        }} 
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.4)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title={`${d.label}: ${formatRupiah(d.revenue)}`} />
                        
                        <span style={{ position: 'absolute', top: '-22px', fontSize: '10px', color: 'var(--color-text-accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {formatRupiah(d.revenue).replace('Rp', '').trim()}
                        </span>
                        
                        <span style={{ position: 'absolute', top: `${150 - topPx + 15}px`, fontSize: '10px', color: 'var(--color-text-muted)', transform: chartView === 'daily' ? 'rotate(-30deg)' : 'none', transformOrigin: 'top center', whiteSpace: 'nowrap' }}>
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <BarChart3 size={36} style={{ opacity: 0.3 }} />
              <span>Tidak ada data pendapatan</span>
            </div>
          )}
        </div>

        {/* Revenue by Service */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '18px' }}>
            Pendapatan per Layanan
          </h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '50px', borderRadius: '8px' }} />)}
            </div>
          ) : serviceRevenue.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {serviceRevenue.map(([svc, data], i) => {
                const maxSvc = serviceRevenue[0]?.[1]?.total || 1;
                const pct = (data.total / maxSvc) * 100;
                const colors = ['#0055ff', '#00d4ff', '#22c55e', '#fbbf24'];
                return (
                  <div key={svc}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12.5px', color: 'var(--color-text-sub)', fontWeight: 500 }}>{svc}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-accent)' }}>
                          {formatRupiah(data.total)}
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                          {data.count} transaksi
                        </div>
                      </div>
                    </div>
                    <div style={{ height: '5px', borderRadius: '3px', background: 'var(--color-border-subtle)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: colors[i % colors.length],
                        borderRadius: '3px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px' }}>
              <span>Tidak ada data</span>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="glass-card" style={{ marginTop: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>Rincian Transaksi</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {report?.orders?.length ?? 0} transaksi
          </p>
        </div>
        {loading ? (
          <div style={{ padding: '20px' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px', marginBottom: '8px' }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg-table-header)', zIndex: 1 }}>
                <tr>
                  <th>Kode Order</th>
                  <th>Pelanggan</th>
                  <th>Total</th>
                  <th>Bayar</th>
                  <th>Tgl Order</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(report?.orders || []).map(o => (
                  <tr key={o.id}>
                    <td><span className="badge badge-blue" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{o.order_code}</span></td>
                    <td style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{o.customer?.customer_name}</td>
                    <td style={{ color: 'var(--color-text-accent)', fontWeight: 700 }}>{formatRupiah(o.total)}</td>
                    <td style={{ fontSize: '12.5px' }}>{o.order_pay ? formatRupiah(o.order_pay) : '—'}</td>
                    <td style={{ fontSize: '12.5px' }}>{new Date(o.order_date).toLocaleDateString('id-ID')}</td>
                    <td>
                      {o.order_status === 0
                        ? <span className="badge badge-pending">Baru</span>
                        : <span className="badge badge-done">Diambil</span>
                      }
                    </td>
                  </tr>
                ))}
                {(report?.orders || []).length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <BarChart3 size={32} style={{ opacity: 0.3 }} />
                        <span>Tidak ada data transaksi</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaporanPage;
