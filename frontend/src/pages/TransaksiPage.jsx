import { useState, useEffect } from 'react';
import {
  Plus, Trash2, X, Search, ShoppingBag, Loader2, Clock, CheckCircle, Droplets, Wind, Star,
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const STATUS_MAP = {
  0: { label: 'Diterima', color: 'badge-cyan',    icon: ShoppingBag },
  1: { label: 'Dicuci',   color: 'badge-blue',    icon: Droplets },
  2: { label: 'Disetrika',color: 'badge-pending', icon: Wind },
  3: { label: 'Selesai',  color: 'badge-done',    icon: Star },
  4: { label: 'Diambil',  color: 'badge-done',    icon: CheckCircle },
};

// =============================================
// MODAL BUAT ORDER (Penerimaan Laundry)
// Pakaian belum ditimbang — hanya pilih layanan
// =============================================
const OrderModal = ({ customers, services, onClose, onSuccess }) => {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderEndDate, setOrderEndDate] = useState('');
  const [details, setDetails] = useState([{ id_service: '', notes: '' }]);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const addDetailRow = () => setDetails(prev => [...prev, { id_service: '', notes: '' }]);
  const removeDetailRow = (i) => setDetails(prev => prev.filter((_, idx) => idx !== i));
  const updateDetail = (i, field, value) =>
    setDetails(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) return toast.error('Pilih pelanggan terlebih dahulu.');
    const validDetails = details.filter(d => d.id_service);
    if (validDetails.length === 0) return toast.error('Tambahkan minimal satu jenis layanan.');

    setLoading(true);
    try {
      await api.post('/orders', {
        id_customer: Number(customerId),
        order_date: orderDate,
        order_end_date: orderEndDate || undefined,
        details: validDetails.map(d => ({
          id_service: Number(d.id_service),
          notes: d.notes,
        })),
      });
      toast.success('Laundry berhasil diterima! Status: Diterima.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box modal-box-lg">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-main)' }}>Terima Laundry Baru</h2>
            <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              Pilih layanan — penimbangan dilakukan setelah proses selesai
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Customer */}
            <div>
              <label className="form-label">Pelanggan *</label>
              <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)} required id="order-customer">
                <option value="">-- Pilih Pelanggan --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customer_name} ({c.phone})</option>
                ))}
              </select>
            </div>

            {/* Tanggal */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="form-label">Tanggal Masuk</label>
                <input type="date" className="form-input" value={orderDate} min={today}
                  onChange={e => {
                    const v = e.target.value; setOrderDate(v);
                    if (orderEndDate && v > orderEndDate) setOrderEndDate('');
                  }} id="order-date" />
              </div>
              <div>
                <label className="form-label">Estimasi Selesai</label>
                <input type="date" className="form-input" value={orderEndDate}
                  min={orderDate || today}
                  onChange={e => setOrderEndDate(e.target.value)} id="order-end-date" />
              </div>
            </div>

            {/* Layanan */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Jenis Layanan *</label>
                <button type="button" className="btn-secondary" onClick={addDetailRow} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Plus size={13} /> Tambah
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {details.map((d, i) => (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '2fr 2fr auto',
                    gap: '8px', alignItems: 'end', padding: '12px', borderRadius: '10px',
                    background: 'var(--color-bg-table-hover)', border: '1px solid var(--color-border-subtle)',
                  }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Jenis Layanan</label>
                      <select className="form-select" value={d.id_service}
                        onChange={e => updateDetail(i, 'id_service', e.target.value)} id={`detail-service-${i}`}>
                        <option value="">-- Pilih Layanan --</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id}>{s.service_name} — {formatRupiah(s.price)}/kg</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '11px' }}>Catatan</label>
                      <input type="text" className="form-input" placeholder="Opsional..." value={d.notes}
                        onChange={e => updateDetail(i, 'notes', e.target.value)} id={`detail-notes-${i}`} />
                    </div>
                    <div style={{ paddingBottom: '2px' }}>
                      {details.length > 1 && (
                        <button type="button" className="btn-icon" onClick={() => removeDetailRow(i)}
                          style={{ color: '#f87171', width: 34, height: 34 }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div style={{
              padding: '12px 16px', borderRadius: '10px',
              background: 'rgba(34,228,255,0.05)', border: '1px solid rgba(34,228,255,0.15)',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
            }}>
              <Clock size={15} style={{ color: 'var(--color-text-accent)', flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Pakaian <strong style={{ color: 'var(--color-text-accent)' }}>belum ditimbang</strong> di tahap ini.
                Penimbangan & perhitungan biaya dilakukan setelah proses selesai melalui menu <strong>Tracking Laundry</strong>.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading} id="order-submit">
              {loading
                ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Menyimpan...</>
                : <><ShoppingBag size={15} /> Terima Laundry</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================
// HALAMAN TRANSAKSI MASUK
// =============================================
const TransaksiPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, custRes, svcRes] = await Promise.all([
        api.get('/orders'),
        api.get('/master/customers'),
        api.get('/master/services'),
      ]);
      setOrders(ordRes.data.data);
      setCustomers(custRes.data.data);
      setServices(svcRes.data.data);
    } catch {
      toast.error('Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = orders.filter(o => {
    const matchSearch = o.order_code.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === '' ? true : o.order_status === Number(statusFilter);
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>Transaksi Masuk</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Riwayat semua order laundry
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} id="btn-new-order">
          <Plus size={16} /> Terima Laundry
        </button>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '300px' }}>
            <Search size={15} className="search-icon" />
            <input className="search-input" placeholder="Cari kode order atau pelanggan..." value={search}
              onChange={e => setSearch(e.target.value)} id="order-search" />
          </div>
          <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ width: '170px' }} id="order-status-filter">
            <option value="">Semua Status</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '20px' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: '48px', borderRadius: '8px', marginBottom: '8px' }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Kode Order</th>
                  <th>Pelanggan</th>
                  <th>Layanan</th>
                  <th>Total</th>
                  <th>Tgl Masuk</th>
                  <th>Est. Selesai</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((order, idx) => {
                  const st = STATUS_MAP[order.order_status] || STATUS_MAP[0];
                  const Icon = st.icon;
                  return (
                    <tr key={order.id}>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{idx + 1}</td>
                      <td>
                        <span className="badge badge-blue" style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>
                          {order.order_code}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{order.customer?.customer_name}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>{order.customer?.phone}</div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {order.order_details?.map(d => d.service?.service_name).join(', ') || '—'}
                      </td>
                      <td style={{ color: 'var(--color-text-accent)', fontWeight: 700 }}>
                        {Number(order.total) > 0 ? formatRupiah(order.total) : <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '12px' }}>Belum ditimbang</span>}
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{new Date(order.order_date).toLocaleDateString('id-ID')}</td>
                      <td style={{ fontSize: '12.5px' }}>
                        {order.order_end_date ? new Date(order.order_end_date).toLocaleDateString('id-ID') : '—'}
                      </td>
                      <td>
                        <span className={`badge ${st.color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Icon size={10} /> {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <ShoppingBag size={36} style={{ opacity: 0.3 }} />
                        <span>Tidak ada transaksi ditemukan</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <OrderModal
          customers={customers}
          services={services}
          onClose={() => setShowModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default TransaksiPage;
