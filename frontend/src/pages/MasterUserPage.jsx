import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Loader2, UserCog, Shield } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import useAuthStore from '../store/authStore';

const levelBadge = {
  1: { label: 'Administrator', css: 'badge-blue' },
  2: { label: 'Operator', css: 'badge-cyan' },
  3: { label: 'Pimpinan', css: 'badge-pending' },
};

const UserModal = ({ user, levels, onClose, onSuccess }) => {
  const toast = useToast();
  const isEdit = !!user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    id_level: user?.id_level || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (isEdit) {
        await api.put(`/master/users/${user.id_user}`, payload);
        toast.success('Pengguna berhasil diperbarui!');
      } else {
        await api.post('/master/users', payload);
        toast.success('Pengguna berhasil ditambahkan!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan pengguna.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-text-main)' }}>
            {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
          </h2>
          <button className="btn-icon" onClick={onClose} style={{ color: 'var(--color-text-muted)' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="form-label">Nama Lengkap *</label>
              <input className="form-input" placeholder="Nama lengkap..." value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required id="user-name" />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" placeholder="email@laundry.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required id="user-email" />
            </div>
            <div>
              <label className="form-label">Role / Level *</label>
              <select className="form-select" value={form.id_level}
                onChange={e => setForm(p => ({ ...p, id_level: Number(e.target.value) }))} required id="user-level">
                <option value="">-- Pilih Role --</option>
                {levels.map(l => (
                  <option key={l.id_level} value={l.id_level}>{l.level_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">
                Password {isEdit ? '(Kosongkan jika tidak diubah)' : '*'}
              </label>
              <input type="password" className="form-input" placeholder="Minimal 8 karakter"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required={!isEdit} id="user-password" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading} id="user-submit">
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
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>Hapus Pengguna</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          Yakin hapus pengguna <strong style={{ color: 'var(--color-text-main)' }}>{label}</strong>?
        </p>
      </div>
      <div className="modal-footer" style={{ justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={onClose}>Batal</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading} id="confirm-delete-user">
          {loading ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Trash2 size={14} />} Hapus
        </button>
      </div>
    </div>
  </div>
);

const MasterUserPage = () => {
  const toast = useToast();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, levelsRes] = await Promise.all([
        api.get('/master/users'),
        api.get('/master/levels'),
      ]);
      setUsers(usersRes.data.data);
      setLevels(levelsRes.data.data);
    } catch { toast.error('Gagal memuat data.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async () => {
    if (deleteTarget.id_user === currentUser.id_user) {
      toast.error('Tidak bisa menghapus akun yang sedang aktif.');
      setDeleteTarget(null);
      return;
    }
    setDelLoading(true);
    try {
      await api.delete(`/master/users/${deleteTarget.id_user}`);
      toast.success('Pengguna berhasil dihapus!');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus.');
    } finally { setDelLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>Manajemen Pengguna</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {users.length} pengguna terdaftar
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditData(null); setShowModal(true); }} id="btn-add-user">
          <Plus size={16} /> Tambah Pengguna
        </button>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '8px', marginBottom: '8px' }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pengguna</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Tgl Daftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const badge = levelBadge[u.id_level] || { label: 'User', css: 'badge-cyan' };
                  const isSelf = u.id_user === currentUser?.id_user;
                  return (
                    <tr key={u.id_user}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '10px',
                            background: isSelf
                              ? 'linear-gradient(135deg, #22c55e, var(--color-gradient-primary-2))'
                              : 'linear-gradient(135deg, var(--color-gradient-primary-1), var(--color-gradient-primary-2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0,
                          }}>
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '13.5px' }}>
                              {u.name}
                              {isSelf && <span style={{ fontSize: '10px', color: 'var(--color-text-accent)', marginLeft: '6px', fontWeight: 500 }}>(Anda)</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{u.email}</td>
                      <td><span className={`badge ${badge.css}`}><Shield size={10} /> {badge.label}</span></td>
                      <td style={{ fontSize: '12.5px' }}>{new Date(u.created_at).toLocaleDateString('id-ID')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" onClick={() => { setEditData(u); setShowModal(true); }}
                            style={{ color: '#5e9bff', width: 32, height: 32 }} id={`edit-user-${u.id_user}`}>
                            <Edit2 size={14} />
                          </button>
                          {!isSelf && (
                            <button className="btn-icon" onClick={() => setDeleteTarget(u)}
                              style={{ color: '#f87171', width: 32, height: 32 }} id={`delete-user-${u.id_user}`}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal user={editData} levels={levels} onClose={() => setShowModal(false)} onSuccess={fetchData} />
      )}
      {deleteTarget && (
        <DeleteModal
          label={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={delLoading}
        />
      )}
    </div>
  );
};

export default MasterUserPage;
