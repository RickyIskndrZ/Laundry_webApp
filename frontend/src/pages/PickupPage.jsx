import { useState, useEffect } from 'react';
import {
  PackageCheck, X, Search, CheckCircle, Loader2,
  Clock, User, CalendarDays, FileText, AlertCircle,
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

// =============================================
// MODAL KONFIRMASI PICKUP
// =============================================
const PickupModal = ({ order, onClose, onSuccess }) => {
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [pickupDate, setPickupDate] = useState(
    new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );
  const [loading, setLoading] = useState(false);

  const totalBiaya = Number(order.total);
  const sudahBayar = Number(order.order_pay || 0);
  const isLunas = totalBiaya > 0 && sudahBayar >= totalBiaya;

  const handlePickup = async () => {
    if (new Date(pickupDate) < new Date(order.order_date)) {
      return toast.error('Tanggal pengambilan tidak boleh mendahului tanggal masuk.');
    }

    setLoading(true);
    try {
      await api.patch(`/orders/${order.id}/pickup`, { notes, pickup_date: pickupDate });
      toast.success(`Pickup order ${order.order_code} berhasil dicatat!`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses pickup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-main)' }}>Konfirmasi Pengambilan</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              Proses pengambilan laundry oleh pelanggan
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Order Summary */}
          <div style={{
            padding: '16px', borderRadius: '12px',
            background: 'var(--color-bg-table-hover)', border: '1px solid var(--color-border-medium)',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { icon: FileText, label: 'Kode Order', value: order.order_code },
                { icon: User, label: 'Pelanggan', value: order.customer?.customer_name },
                { icon: CalendarDays, label: 'Tanggal Masuk', value: new Date(order.order_date).toLocaleDateString('id-ID') },
                { icon: Clock, label: 'Est. Selesai', value: order.order_end_date ? new Date(order.order_end_date).toLocaleDateString('id-ID') : '—' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <item.icon size={11} /> {item.label}
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-main)' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: '14px 0' }} />
            <div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Detail Layanan:</span>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {order.order_details?.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--color-text-sub)' }}>{d.service?.service_name} × {Number(d.qty)} kg</span>
                    <span style={{ color: 'var(--color-text-accent)', fontWeight: 600 }}>{formatRupiah(d.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>Total Tagihan</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-accent)' }}>{formatRupiah(totalBiaya)}</span>
            </div>

            {/* Payment Status */}
            <div style={{
              marginTop: '10px', padding: '8px 12px', borderRadius: '8px',
              background: isLunas ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${isLunas ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isLunas
                  ? <CheckCircle size={13} style={{ color: '#4ade80' }} />
                  : <AlertCircle size={13} style={{ color: '#f87171' }} />
                }
                <span style={{ fontSize: '12px', fontWeight: 600, color: isLunas ? '#4ade80' : '#f87171' }}>
                  {isLunas ? 'Pembayaran Lunas' : 'Belum Lunas'}
                </span>
              </div>
              {!isLunas && (
                <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>
                  Kurang: {formatRupiah(totalBiaya - sudahBayar)}
                </span>
              )}
            </div>
          </div>

          {/* Pickup Date & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div>
              <label className="form-label">Tanggal Pengambilan</label>
              <input
                type="datetime-local"
                className="form-input"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                min={new Date(new Date(order.order_date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              />
            </div>
            <div>
              <label className="form-label">Catatan Pengambilan (Opsional)</label>
              <textarea
                className="form-input"
                style={{ minHeight: '60px', resize: 'vertical' }}
                placeholder="Misal: kondisi laundry sudah rapi, dll..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                id="pickup-notes"
              />
            </div>
          </div>

          {/* Warning */}
          {!isLunas && (
            <div style={{
              marginTop: '12px', padding: '12px', borderRadius: '10px',
              background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '12.5px', color: 'rgba(248,113,113,0.9)', lineHeight: 1.5 }}>
                Pembayaran belum lunas. Selesaikan pembayaran melalui menu <strong>Tracking Laundry</strong> sebelum melakukan pickup.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={handlePickup} disabled={loading || !isLunas} id="confirm-pickup">
            {loading
              ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Memproses...</>
              : <><PackageCheck size={15} /> Konfirmasi Pickup</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================
// HALAMAN PICKUP
// =============================================
const PickupPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      // Hanya tampilkan order yang Selesai/Ready (status=4) — siap diambil
      setOrders(res.data.data.filter(o => o.order_status === 4));
    } catch {
      toast.error('Gagal memuat data order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter(o =>
    o.order_code.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  const lunas = orders.filter(o => Number(o.order_pay) >= Number(o.total) && Number(o.total) > 0).length;
  const belumLunas = orders.filter(o => Number(o.order_pay) < Number(o.total) || Number(o.total) === 0).length;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>Pengambilan Laundry</h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Order yang sudah selesai diproses dan siap diambil
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="glass-card kpi-amber" style={{ padding: '16px 18px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(251,191,36,0.6)', fontWeight: 600, marginBottom: '6px' }}>SIAP DIAMBIL</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#fbbf24' }}>{orders.length}</div>
        </div>
        <div className="glass-card kpi-green" style={{ padding: '16px 18px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(74,222,128,0.6)', fontWeight: 600, marginBottom: '6px' }}>SUDAH LUNAS</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#4ade80' }}>{lunas}</div>
        </div>
        <div className="glass-card kpi-red" style={{ padding: '16px 18px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(248,113,113,0.6)', fontWeight: 600, marginBottom: '6px' }}>BELUM LUNAS</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#f87171' }}>{belumLunas}</div>
        </div>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px', maxWidth: '320px' }}>
            <Search size={15} className="search-icon" />
            <input className="search-input" placeholder="Cari kode order / pelanggan..." value={search}
              onChange={e => setSearch(e.target.value)} id="pickup-search" />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '20px' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '8px', marginBottom: '8px' }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Kode Order</th>
                  <th>Pelanggan</th>
                  <th>Total Tagihan</th>
                  <th>Pembayaran</th>
                  <th>Tgl Masuk</th>
                  <th>Est. Selesai</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map(order => {
                  const totalBiaya = Number(order.total);
                  const sudahBayar = Number(order.order_pay || 0);
                  const isLunas = totalBiaya > 0 && sudahBayar >= totalBiaya;
                  return (
                    <tr key={order.id}>
                      <td>
                        <span className="badge badge-blue" style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>
                          {order.order_code}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{order.customer?.customer_name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>{order.customer?.phone}</div>
                      </td>
                      <td style={{ color: 'var(--color-text-accent)', fontWeight: 700 }}>{formatRupiah(totalBiaya)}</td>
                      <td>
                        {isLunas
                          ? <span className="badge badge-done" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle size={10} /> Lunas
                            </span>
                          : <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={10} /> Belum Lunas
                            </span>
                        }
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{new Date(order.order_date).toLocaleDateString('id-ID')}</td>
                      <td style={{ fontSize: '12.5px' }}>
                        {order.order_end_date ? new Date(order.order_end_date).toLocaleDateString('id-ID') : '—'}
                      </td>
                      <td>
                        <button
                          className={isLunas ? 'btn-success' : 'btn-secondary'}
                          onClick={() => setSelectedOrder(order)}
                          id={`pickup-btn-${order.id}`}
                          title={!isLunas ? 'Pembayaran belum lunas' : 'Proses Pickup'}
                          style={{ opacity: isLunas ? 1 : 0.6 }}
                        >
                          <PackageCheck size={13} /> Pickup
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <PackageCheck size={36} style={{ opacity: 0.3 }} />
                        <span>Tidak ada laundry yang siap diambil</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <PickupModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
};

export default PickupPage;
