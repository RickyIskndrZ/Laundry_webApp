import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, Users } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

// =============================================
// MODAL FORM CUSTOMER
// =============================================
const CustomerModal = ({ customer, onClose, onSuccess }) => {
  const toast = useToast();
  const isEdit = !!customer;
  const [form, setForm] = useState({
    customer_name: customer?.customer_name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/master/customers/${customer.id}`, form);
        toast.success('Pelanggan berhasil diperbarui!');
      } else {
        await api.post('/master/customers', form);
        toast.success('Pelanggan berhasil ditambahkan!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data pelanggan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-main)' }}>
              {isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
            </h2>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Nama Pelanggan *</label>
              <input name="customer_name" className="form-input" placeholder="Nama lengkap..."
                value={form.customer_name} onChange={handleChange} required id="customer-name" />
            </div>
            <div>
              <label className="form-label">No. Telepon *</label>
              <input name="phone" type="tel" className="form-input" placeholder="08xx-xxxx-xxxx"
                value={form.phone} onChange={handleChange} required id="customer-phone" />
            </div>
            <div>
              <label className="form-label">Alamat *</label>
              <textarea name="address" className="form-input" placeholder="Alamat lengkap..."
                style={{ minHeight: '80px', resize: 'vertical' }}
                value={form.address} onChange={handleChange} required id="customer-address" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading} id="customer-submit">
              {loading ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Menyimpan...</> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================
// MODAL KONFIRMASI HAPUS
// =============================================
const DeleteModal = ({ label, onClose, onConfirm, loading }) => (
  <div className="modal-overlay">
    <div className="modal-box" style={{ maxWidth: '380px' }}>
      <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '14px',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Trash2 size={22} style={{ color: '#f87171' }} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>Konfirmasi Hapus</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Yakin ingin menghapus <strong style={{ color: 'var(--color-text-main)' }}>{label}</strong>?
          Tindakan ini tidak bisa dibatalkan.
        </p>
      </div>
      <div className="modal-footer" style={{ justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading} id="confirm-delete">
          {loading ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Trash2 size={14} />}
          Hapus
        </button>
      </div>
    </div>
  </div>
);

// =============================================
// HALAMAN MASTER CUSTOMER
// =============================================
const MasterCustomerPage = () => {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/master/customers');
      setCustomers(res.data.data);
    } catch { toast.error('Gagal memuat data pelanggan.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/master/customers/${deleteTarget.id}`);
      toast.success('Pelanggan berhasil dihapus!');
      setDeleteTarget(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pelanggan.');
    } finally { setDelLoading(false); }
  };

  const filtered = customers.filter(c =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>Master Pelanggan</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {customers.length} pelanggan terdaftar
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditData(null); setShowModal(true); }} id="btn-add-customer">
          <Plus size={16} /> Tambah Pelanggan
        </button>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '320px' }}>
            <Search size={15} className="search-icon" />
            <input className="search-input" placeholder="Cari nama atau telepon..." value={search}
              onChange={e => setSearch(e.target.value)} id="customer-search" />
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
                  <th>#</th>
                  <th>Nama Pelanggan</th>
                  <th>No. Telepon</th>
                  <th>Alamat</th>
                  <th>Tgl Daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map((c, idx) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '8px',
                          background: 'linear-gradient(135deg, var(--color-gradient-primary-1), var(--color-gradient-primary-2))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {c.customer_name[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{c.customer_name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px', color: 'var(--color-text-sub)' }}>{c.phone}</td>
                    <td style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.address}
                    </td>
                    <td style={{ fontSize: '12.5px' }}>{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-icon" onClick={() => { setEditData(c); setShowModal(true); }}
                          style={{ color: '#5e9bff', width: 32, height: 32 }} id={`edit-customer-${c.id}`}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon" onClick={() => setDeleteTarget(c)}
                          style={{ color: '#f87171', width: 32, height: 32 }} id={`delete-customer-${c.id}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Users size={36} style={{ opacity: 0.3 }} />
                        <span>Tidak ada pelanggan ditemukan</span>
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
        <CustomerModal
          customer={editData}
          onClose={() => setShowModal(false)}
          onSuccess={fetchCustomers}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          label={deleteTarget.customer_name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={delLoading}
        />
      )}
    </div>
  );
};

export default MasterCustomerPage;
