import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Loader2, Settings, LayoutGrid, List } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const ServiceModal = ({ service, onClose, onSuccess }) => {
  const toast = useToast();
  const isEdit = !!service;
  const [form, setForm] = useState({
    service_name: service?.service_name || '',
    price: service?.price || '',
    description: service?.description || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/master/services/${service.id}`, form);
        toast.success('Layanan berhasil diperbarui!');
      } else {
        await api.post('/master/services', form);
        toast.success('Layanan berhasil ditambahkan!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan layanan.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-main)' }}>
            {isEdit ? 'Edit Layanan' : 'Tambah Layanan'}
          </h2>
          <button className="btn-icon" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Nama Layanan *</label>
              <input className="form-input" placeholder="Nama layanan..." value={form.service_name}
                onChange={e => setForm(p => ({ ...p, service_name: e.target.value }))} required id="service-name" />
            </div>
            <div>
              <label className="form-label">Harga per Kg (Rp) *</label>
              <input type="number" className="form-input" placeholder="5000" value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required min="0" id="service-price" />
            </div>
            <div>
              <label className="form-label">Deskripsi</label>
              <textarea className="form-input" placeholder="Deskripsi layanan..." value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={{ minHeight: '80px', resize: 'vertical' }} id="service-desc" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading} id="service-submit">
              {loading ? <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> : null}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteModal = ({ label, onClose, onConfirm, loading }) => (
  <div className="modal-overlay">
    <div className="modal-box" style={{ maxWidth: '380px' }}>
      <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '14px',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
        }}>
          <Trash2 size={22} style={{ color: '#f87171' }} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>Konfirmasi Hapus</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Yakin hapus layanan <strong style={{ color: 'var(--color-text-main)' }}>{label}</strong>?
        </p>
      </div>
      <div className="modal-footer" style={{ justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading} id="confirm-delete-svc">
          {loading ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Trash2 size={14} />} Hapus
        </button>
      </div>
    </div>
  </div>
);

const MasterServicePage = () => {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/master/services');
      setServices(res.data.data);
    } catch { toast.error('Gagal memuat data layanan.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const handleDelete = async () => {
    setDelLoading(true);
    try {
      await api.delete(`/master/services/${deleteTarget.id}`);
      toast.success('Layanan berhasil dihapus!');
      setDeleteTarget(null);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus.');
    } finally { setDelLoading(false); }
  };

  const serviceColors = ['kpi-blue', 'kpi-cyan', 'kpi-green', 'kpi-amber'];

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>Jenis Layanan</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Kelola daftar layanan dan harga
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--color-bg-table-hover)', borderRadius: '8px', padding: '4px' }}>
             <button 
                className={`btn-icon ${viewMode === 'grid' ? 'active' : ''}`} 
                onClick={() => setViewMode('grid')}
                style={{ 
                   width: 32, height: 32, borderRadius: '6px', 
                   background: viewMode === 'grid' ? 'var(--color-border-subtle)' : 'transparent',
                   color: viewMode === 'grid' ? 'var(--color-text-accent)' : 'var(--color-text-muted)'
                }}
             >
                <LayoutGrid size={16} />
             </button>
             <button 
                className={`btn-icon ${viewMode === 'list' ? 'active' : ''}`} 
                onClick={() => setViewMode('list')}
                style={{ 
                   width: 32, height: 32, borderRadius: '6px', 
                   background: viewMode === 'list' ? 'var(--color-border-subtle)' : 'transparent',
                   color: viewMode === 'list' ? 'var(--color-text-accent)' : 'var(--color-text-muted)'
                }}
             >
                <List size={16} />
             </button>
          </div>
          <button className="btn-primary" onClick={() => { setEditData(null); setShowModal(true); }} id="btn-add-service">
            <Plus size={16} /> Tambah Layanan
          </button>
        </div>
      </div>

      {/* Service Cards */}
      {loading ? (
        viewMode === 'grid' ? (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
             {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px' }} />)}
           </div>
        ) : (
           <div style={{ padding: '20px' }}>
             {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '8px', marginBottom: '8px' }} />)}
           </div>
        )
      ) : (
        viewMode === 'grid' ? (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
             {services.map((s, i) => (
               <div key={s.id} className={`glass-card glass-card-hover ${serviceColors[i % 4]}`} style={{ padding: '22px', borderRadius: '16px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                   <div style={{
                     width: 40, height: 40, borderRadius: '10px',
                     background: 'var(--color-btn-icon-hover)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                   }}>
                     <Settings size={18} style={{ color: 'var(--color-text-muted)' }} />
                   </div>
                   <div style={{ display: 'flex', gap: '5px' }}>
                     <button className="btn-icon" onClick={() => { setEditData(s); setShowModal(true); }}
                       style={{ color: '#5e9bff', width: 30, height: 30 }} id={`edit-svc-${s.id}`}>
                       <Edit2 size={13} />
                     </button>
                     <button className="btn-icon" onClick={() => setDeleteTarget(s)}
                       style={{ color: '#f87171', width: 30, height: 30 }} id={`delete-svc-${s.id}`}>
                       <Trash2 size={13} />
                     </button>
                   </div>
                 </div>
                 <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '6px' }}>
                   {s.service_name}
                 </h3>
                 {s.description && (
                   <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                     {s.description}
                   </p>
                 )}
                 <div style={{
                   padding: '8px 12px', borderRadius: '8px',
                   background: 'var(--color-bg-table-hover)',
                   border: '1px solid var(--color-border-subtle)',
                   display: 'inline-block',
                 }}>
                   <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-accent)' }}>
                     {formatRupiah(s.price)}
                   </span>
                   <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '4px' }}>/ kg</span>
                 </div>
               </div>
             ))}
           </div>
        ) : (
           <div className="glass-card" style={{ overflow: 'hidden', marginBottom: '28px' }}>
             <div style={{ overflowX: 'auto' }}>
               <table className="data-table">
                 <thead>
                   <tr>
                     <th>#</th>
                     <th>Nama Layanan</th>
                     <th>Deskripsi</th>
                     <th>Harga / Kg</th>
                     <th>Aksi</th>
                   </tr>
                 </thead>
                 <tbody>
                   {services.length > 0 ? services.map((s, idx) => (
                     <tr key={s.id}>
                       <td style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>{idx + 1}</td>
                       <td>
                         <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{s.service_name}</span>
                       </td>
                       <td style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                         {s.description || '-'}
                       </td>
                       <td>
                         <span style={{ fontWeight: 600, color: 'var(--color-text-accent)' }}>
                           {formatRupiah(s.price)}
                         </span>
                       </td>
                       <td>
                         <div style={{ display: 'flex', gap: '6px' }}>
                           <button className="btn-icon" onClick={() => { setEditData(s); setShowModal(true); }}
                             style={{ color: '#5e9bff', width: 32, height: 32 }} id={`edit-svc-${s.id}`}>
                             <Edit2 size={14} />
                           </button>
                           <button className="btn-icon" onClick={() => setDeleteTarget(s)}
                             style={{ color: '#f87171', width: 32, height: 32 }} id={`delete-svc-${s.id}`}>
                             <Trash2 size={14} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan={5}>
                         <div className="empty-state">
                           <Settings size={36} style={{ opacity: 0.3 }} />
                           <span>Tidak ada layanan ditemukan</span>
                         </div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        )
      )}

      {showModal && (
        <ServiceModal service={editData} onClose={() => setShowModal(false)} onSuccess={fetchServices} />
      )}
      {deleteTarget && (
        <DeleteModal
          label={deleteTarget.service_name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={delLoading}
        />
      )}
    </div>
  );
};

export default MasterServicePage;
