import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Droplets, Wind, Star, ChevronRight, Loader2,
  Scale, X, User, CalendarDays, FileText, Clock, CheckCircle, Search, History, Download, Trash2
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const formatDateTime = (dateString) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const COLUMNS = [
  { status: 0, label: 'Diterima',      icon: ShoppingBag, color: '#22e4ff',  bg: 'rgba(34,228,255,0.08)',  border: 'rgba(34,228,255,0.2)' },
  // { status: 1, label: 'Dicuci',        icon: Droplets,    color: '#3b82f6',  bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.2)' },
  // { status: 2, label: 'Disetrika',     icon: Wind,        color: '#f59e0b',  bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  // { status: 3, label: 'Penimbangan',   icon: Scale,       color: '#8b5cf6',  bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)' },
  { status: 4, label: 'Selesai / Ready', icon: Star,      color: '#4ade80',  bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)' },
];

const ADVANCE_LABELS = {
  0: { action: 'Penimbangan',    icon: Scale }, // { action: 'Mulai Cuci',     icon: Droplets },
  // 1: { action: 'Mulai Setrika',  icon: Wind },
  // 2: { action: 'Mulai Timbang',  icon: Scale },
  // 3: { action: 'Penimbangan',    icon: Scale },
  4: { action: 'Bayar',          icon: FileText },
};

// =============================================
// MODAL LOG STATUS
// =============================================
const StatusLogModal = ({ onClose }) => {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/orders/logs');
        setLogs(res.data.data);
      } catch (err) {
        toast.error('Gagal memuat log status.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [toast]);

  const filteredLogs = logs.filter(log => {
    const matchSearch = 
      log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.customer?.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.order?.order_code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' ? true : log.status_code === Number(statusFilter);
    return matchSearch && matchStatus;
  });

  const handleDownloadCSV = () => {
    if (filteredLogs.length === 0) return toast.error('Tidak ada data untuk didownload.');
    
    const headers = ['Waktu', 'Order Code', 'Pelanggan', 'Petugas', 'Role', 'Status Update'];
    const rows = filteredLogs.map(log => [
      formatDateTime(log.pickup_date),
      log.order?.order_code,
      log.customer?.customer_name,
      log.user ? log.user.name : 'Sistem',
      log.user ? log.user.level?.level_name : '-',
      log.status_label
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.map(String).map(v => v.includes(',') ? `"${v}"` : v).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Riwayat_Status_Laundry_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus SEMUA riwayat status? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      const res = await api.delete('/orders/logs');
      toast.success(res.data.message);
      setLogs([]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus riwayat status.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-lg" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-main)' }}>Riwayat Perubahan Status</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              Memantau petugas yang melakukan update status laundry
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <Search size={15} className="search-icon" />
              <input className="search-input" placeholder="Cari petugas, pelanggan, order..." value={search}
                onChange={e => setSearch(e.target.value)} id="log-search" />
            </div>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ width: '160px' }} id="log-status-filter">
              <option value="">Semua Status</option>
              {COLUMNS.map(c => <option key={c.status} value={c.status}>{c.label}</option>)}
              <option value="5">Diambil</option>
            </select>
            <button className="btn-secondary" onClick={handleDownloadCSV} title="Download CSV">
              <Download size={15} />
            </button>
            <button className="btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }} 
              onClick={handleClearLogs} title="Reset Riwayat">
              <Trash2 size={15} />
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border-subtle)', borderRadius: '10px' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Order & Pelanggan</th>
                  <th>Petugas (PIC)</th>
                  <th>Status Update</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '30px' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto', color: 'var(--color-text-muted)' }} />
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map(log => {
                    const col = COLUMNS.find(c => c.status === log.status_code) || { color: '#4ade80', icon: CheckCircle };
                    const Icon = col.icon;
                    return (
                      <tr key={log.id}>
                        <td style={{ fontSize: '12px', color: 'var(--color-text-sub)' }}>
                          {formatDateTime(log.pickup_date)}
                        </td>
                        <td>
                          <div style={{ fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--color-text-accent)' }}>
                            {log.order?.order_code}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px' }}>
                            {log.customer?.customer_name}
                          </div>
                        </td>
                        <td>
                          {log.user ? (
                            <>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                                {log.user.name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                {log.user.level?.level_name}
                              </div>
                            </>
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sistem / Unknown</span>
                          )}
                        </td>
                        <td>
                          <span style={{ 
                            display: 'inline-flex', alignItems: 'center', gap: '5px', 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700,
                            color: col.color, background: `rgba(${col.color.replace('#','').match(/.{2}/g).map(x=>parseInt(x,16)).join(',')}, 0.1)` 
                          }}>
                            <Icon size={12} /> {log.status_label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">
                        <History size={36} style={{ opacity: 0.3 }} />
                        <span>Tidak ada log aktivitas</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================
// MODAL PENIMBANGAN (Tanpa Pembayaran)
// =============================================
const WeighModal = ({ order, onClose, onSuccess }) => {
  const toast = useToast();
  const [weights, setWeights] = useState(
    order.order_details.map(d => ({ id: d.id, service_name: d.service?.service_name, price: Number(d.service?.price || 0), qty: '' }))
  );
  const [loading, setLoading] = useState(false);

  const updateWeight = (i, val) => setWeights(prev => prev.map((w, idx) => idx === i ? { ...w, qty: val } : w));

  const total = weights.reduce((sum, w) => sum + (Number(w.qty) > 0 ? w.price * Number(w.qty) : 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const w of weights) {
      if (!w.qty || Number(w.qty) <= 0) {
        return toast.error(`Masukkan berat untuk layanan "${w.service_name}".`);
      }
    }

    setLoading(true);
    try {
      await api.patch(`/orders/${order.id}/weigh`, {
        details: weights.map(w => ({ id: w.id, qty: Number(w.qty) })),
      });
      toast.success(`Order ${order.order_code} selesai ditimbang! Total: ${formatRupiah(total)}`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses penimbangan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-lg">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Penimbangan & Pembayaran
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              {order.order_code} — {order.customer?.customer_name}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Layanan & Berat */}
            <div>
              <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
                Berat Aktual per Layanan (kg)
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {weights.map((w, i) => (
                  <div key={w.id} style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
                    gap: '10px', alignItems: 'end', padding: '14px', borderRadius: '10px',
                    background: 'var(--color-bg-table-hover)', border: '1px solid var(--color-border-subtle)',
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Layanan</div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-main)' }}>{w.service_name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-accent)', marginTop: '2px' }}>
                        {formatRupiah(w.price)} / kg
                      </div>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Berat (kg)</label>
                      <input type="number" className="form-input" placeholder="0.0" step="0.1" min="0.1"
                        value={w.qty} onChange={e => updateWeight(i, e.target.value)}
                        id={`weigh-qty-${i}`} required />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Subtotal</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-accent)' }}>
                        {Number(w.qty) > 0 ? formatRupiah(w.price * Number(w.qty)) : '—'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total (Hanya Info) */}
            <div style={{
              padding: '16px', borderRadius: '12px',
              background: 'var(--color-bg-table-hover)', border: '1px solid var(--color-border-medium)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-sub)' }}>Estimasi Tagihan</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-accent)' }}>
                  {formatRupiah(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading} id="weigh-submit">
              {loading
                ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Menyimpan...</>
                : <><Scale size={15} /> Selesai Ditimbang</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================
// KARTU ORDER di Kanban
// =============================================
const OrderCard = ({ order, onAdvance, onWeigh, onPay, onCancelPay, advanceLoading }) => {
  const st = order.order_status;
  const col = COLUMNS.find(c => c.status === st);
  const isLunas = Number(order.order_pay) >= Number(order.total) && Number(order.total) > 0;

  return (
    <div style={{
      background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-subtle)',
      borderRadius: '12px', padding: '14px', marginBottom: '10px',
      transition: 'box-shadow 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span className="badge badge-blue" style={{ fontFamily: 'monospace', fontSize: '10.5px' }}>
          {order.order_code}
        </span>
        {order.order_end_date && (
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <CalendarDays size={10} />
            {new Date(order.order_end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Pelanggan */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <div style={{
          width: 24, height: 24, borderRadius: '6px', flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-gradient-primary-1), var(--color-gradient-primary-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, color: 'white',
        }}>
          {order.customer?.customer_name?.[0]?.toUpperCase()}
        </div>
        <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '13px' }}>
          {order.customer?.customer_name}
        </div>
      </div>

      {/* Layanan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
        {order.order_details?.map(d => (
          <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--color-text-sub)' }}>{d.service?.service_name}</span>
            {st >= 4 && Number(d.qty) > 0
              ? <span style={{ color: 'var(--color-text-accent)', fontWeight: 600 }}>
                  {Number(d.qty)} kg
                </span>
              : <span style={{ color: 'var(--color-text-muted)' }}>belum ditimbang</span>
            }
          </div>
        ))}
      </div>

      {/* Total (jika sudah ditimbang) */}
      {st >= 4 && Number(order.total) > 0 && (
        <div style={{
          padding: '8px 10px', borderRadius: '8px', marginBottom: '10px',
          background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Total</span>
          <span style={{ fontWeight: 700, color: '#4ade80', fontSize: '14px' }}>{formatRupiah(order.total)}</span>
        </div>
      )}

      {/* Payment status jika Selesai */}
      {st === 4 && (
        <div style={{
          padding: '6px 10px', borderRadius: '8px', marginBottom: '10px',
          background: Number(order.order_pay) >= Number(order.total) && Number(order.total) > 0
            ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1px solid ${Number(order.order_pay) >= Number(order.total) && Number(order.total) > 0
            ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          {Number(order.order_pay) >= Number(order.total) && Number(order.total) > 0
            ? <><CheckCircle size={12} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>LUNAS</span></>
            : <><Clock size={12} style={{ color: '#f87171' }} />
              <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>Belum Lunas</span></>
          }
        </div>
      )}

      {/* Action Button */}
      {st < 5 && ADVANCE_LABELS[st] && (
        <button
          className={st === 4 && isLunas ? "btn-secondary" : "btn-primary"}
          style={{ width: '100%', padding: '8px', fontSize: '12.5px', justifyContent: 'center', 
            ...(st === 4 && isLunas ? { color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' } : {})
          }}
          onClick={() => {
            if (st === 0) onWeigh(order); // if (st === 3) onWeigh(order);
            // else if (st === 3) onWeigh(order);
            else if (st === 4) {
              if (isLunas) onCancelPay(order.id);
              else onPay(order);
            } else onAdvance(order.id);
          }}
          disabled={advanceLoading === order.id}
          id={`advance-btn-${order.id}`}
        >
          {advanceLoading === order.id
            ? <Loader2 size={13} style={{ animation: 'spin 0.7s linear infinite' }} />
            : <>
              {st === 4 && isLunas ? <X size={13} /> : (() => { const Ic = ADVANCE_LABELS[st].icon; return <Ic size={13} />; })()}
              {st === 4 && isLunas ? 'Batal Lunas' : ADVANCE_LABELS[st].action}
              {(!isLunas || st !== 4) && <ChevronRight size={13} />}
            </>
          }
        </button>
      )}
    </div>
  );
};

// =============================================
// MODAL PEMBAYARAN
// =============================================
const PaymentModal = ({ order, onClose, onSuccess }) => {
  const toast = useToast();
  const [orderPay, setOrderPay] = useState('');
  const [taxPct, setTaxPct] = useState('10');
  const [loading, setLoading] = useState(false);

  const baseTotal = Number(order.total) || 0;
  const taxAmount = (baseTotal * Number(taxPct || 0)) / 100;
  const grandTotal = baseTotal + taxAmount;
  
  const change = orderPay ? Number(orderPay) - grandTotal : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderPay || Number(orderPay) <= 0) {
      return toast.error('Masukkan nominal pembayaran.');
    }
    if (Number(orderPay) < grandTotal) {
      return toast.error('Uang pembayaran kurang dari total tagihan.');
    }
    
    setLoading(true);
    try {
      await api.patch(`/orders/${order.id}/pay`, {
        order_pay: Number(orderPay),
        tax_pct: Number(taxPct || 0)
      });
      toast.success(`Pembayaran sebesar ${formatRupiah(Number(orderPay))} berhasil dicatat.`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700 }}>Konfirmasi Pembayaran</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              {order.order_code} - {order.customer?.customer_name}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--color-bg-table-hover)', border: '1px solid var(--color-border-medium)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>Subtotal</span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {formatRupiah(baseTotal)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px dashed var(--color-border-medium)' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Pajak
                  <input type="number" className="form-input" style={{ width: '60px', padding: '4px', fontSize: '11px', textAlign: 'center' }}
                    value={taxPct} onChange={e => setTaxPct(e.target.value)} min="0" max="100" />
                  %
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-accent)' }}>
                  + {formatRupiah(taxAmount)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-sub)' }}>Grand Total</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-accent)' }}>
                  {formatRupiah(grandTotal)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Bayar (Rp)</label>
                  <input type="number" className="form-input" placeholder={`Min. ${grandTotal}`} value={orderPay}
                    onChange={e => setOrderPay(e.target.value)} id="pay-input" autoFocus />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '11px' }}>Kembalian</label>
                  <div className="form-input" style={{
                    color: change !== null ? (change >= 0 ? '#4ade80' : '#f87171') : 'var(--color-text-muted)',
                    fontWeight: change !== null ? 600 : 400,
                  }}>
                    {change !== null ? formatRupiah(change) : '—'}
                  </div>
                  {change !== null && change < 0 && (
                    <p style={{ fontSize: '11px', color: '#f87171', marginTop: '5px', lineHeight: 1.4 }}>
                      ⚠️ Bayar kurang <strong>{formatRupiah(Math.abs(change))}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading} id="pay-submit">
              {loading ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : 'Konfirmasi Pembayaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================
// KANBAN COLUMN
// =============================================
const KanbanColumn = ({ col, orders, onAdvance, onWeigh, onPay, onCancelPay, advanceLoading }) => {
  const Icon = col.icon;
  return (
    <div style={{ flex: '1 1 280px', minWidth: '280px' }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px', borderRadius: '12px 12px 0 0',
        background: col.bg, border: `1px solid ${col.border}`, borderBottom: 'none',
        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0',
      }}>
        <Icon size={16} style={{ color: col.color }} />
        <span style={{ fontWeight: 700, color: col.color, fontSize: '13px' }}>{col.label}</span>
        <span style={{
          marginLeft: 'auto', background: col.border, color: col.color,
          borderRadius: '20px', padding: '1px 8px', fontSize: '11px', fontWeight: 700,
        }}>
          {orders.length}
        </span>
      </div>
      {/* Cards */}
      <div style={{
        padding: '12px', minHeight: '150px', borderRadius: '0 0 12px 12px',
        background: 'var(--color-bg-nav-hover)', border: `1px solid ${col.border}`,
      }}>
        {orders.length === 0
          ? <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-muted)', fontSize: '12px', opacity: 0.6 }}>
              Tidak ada order
            </div>
          : orders.map(o => (
            <OrderCard key={o.id} order={o} onAdvance={onAdvance} onWeigh={onWeigh} onPay={onPay} onCancelPay={onCancelPay} advanceLoading={advanceLoading} />
          ))
        }
      </div>
    </div>
  );
};

// =============================================
// HALAMAN TRACKING LAUNDRY
// =============================================
const TrackingPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [advanceLoading, setAdvanceLoading] = useState(null);
  const [weighTarget, setWeighTarget] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      // Hanya tampilkan order yang belum diambil (status 0,1,2,3,4)
      setOrders(res.data.data.filter(o => o.order_status < 5));
    } catch {
      toast.error('Gagal memuat data order.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAdvance = async (orderId) => {
    setAdvanceLoading(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/status`);
      toast.success(res.data.message);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status.');
    } finally {
      setAdvanceLoading(null);
    }
  };

  const handleCancelPay = async (orderId) => {
    if (!window.confirm('Yakin ingin membatalkan pembayaran untuk order ini?')) return;
    setAdvanceLoading(orderId);
    try {
      const res = await api.patch(`/orders/${orderId}/cancel-pay`);
      toast.success(res.data.message);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pembayaran.');
    } finally {
      setAdvanceLoading(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = 
      o.order_code.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.customer_name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const ordersByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = filteredOrders.filter(o => o.order_status === col.status);
    return acc;
  }, {});

  const totalActive = filteredOrders.length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>Tracking Laundry</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {totalActive} order aktif sedang dalam proses pengerjaan
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ width: '250px' }}>
            <Search size={15} className="search-icon" />
            <input className="search-input" placeholder="Cari nama pelanggan atau order..." value={search}
              onChange={e => setSearch(e.target.value)} id="tracking-search" />
          </div>
          <button className="btn-secondary" onClick={() => setShowLog(true)} id="btn-show-log">
            <History size={15} /> Riwayat Status
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ flex: '1 1 280px', minWidth: '280px' }}>
              <div className="skeleton" style={{ height: '44px', borderRadius: '12px 12px 0 0', marginBottom: 0 }} />
              <div className="skeleton" style={{ height: '250px', borderRadius: '0 0 12px 12px' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '16px', justifyContent: 'center' }}>
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.status}
              col={col}
              orders={ordersByStatus[col.status] || []}
              onAdvance={handleAdvance}
              onWeigh={setWeighTarget}
              onPay={setPaymentTarget}
              onCancelPay={handleCancelPay}
              advanceLoading={advanceLoading}
            />
          ))}
        </div>
      )}

      {weighTarget && (
        <WeighModal
          order={weighTarget}
          onClose={() => setWeighTarget(null)}
          onSuccess={fetchOrders}
        />
      )}

      {paymentTarget && (
        <PaymentModal
          order={paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={fetchOrders}
        />
      )}

      {showLog && (
        <StatusLogModal onClose={() => setShowLog(false)} />
      )}
    </div>
  );
};

export default TrackingPage;
