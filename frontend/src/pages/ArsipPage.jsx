import { useState, useEffect } from 'react';
import {
  Archive, Download, RotateCcw, Trash2, Search, Loader2, User, FileText, CalendarDays, CheckCircle
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import useAuthStore from '../store/authStore';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

const ArsipPage = () => {
  const toast = useToast();
  const { user } = useAuthStore();
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [undoTarget, setUndoTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await api.get('/archives');
      setArchives(res.data.data);
    } catch {
      toast.error('Gagal memuat data arsip.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArchives(); }, []);

  const filtered = archives.filter(a => {
    const s = search.toLowerCase();
    return (
      a.order?.order_code?.toLowerCase().includes(s) ||
      a.customer?.customer_name?.toLowerCase().includes(s) ||
      a.user?.name?.toLowerCase().includes(s)
    );
  });

  const handleDownloadCSV = () => {
    if (filtered.length === 0) {
      toast.error('Tidak ada data untuk didownload');
      return;
    }

    const headers = ['Kode Order', 'Pelanggan', 'Tgl Order', 'Tgl Diambil', 'Total Tagihan', 'Petugas (PIC)', 'Catatan'];
    const rows = filtered.map(a => [
      a.order?.order_code,
      a.customer?.customer_name,
      new Date(a.order?.order_date).toLocaleString('id-ID'),
      new Date(a.pickup_date).toLocaleString('id-ID'),
      a.order?.total,
      a.user?.name || '—',
      a.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Arsip_Keamanan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUndo = async () => {
    if (!undoTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/archives/${undoTarget.id}/undo`);
      toast.success('Pickup berhasil dibatalkan. Order kembali ke antrian.');
      setUndoTarget(null);
      fetchArchives();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pickup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/archives/${deleteTarget.id}/permanent`);
      toast.success('Arsip dan transaksi berhasil dihapus permanen.');
      setDeleteTarget(null);
      fetchArchives();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus arsip.');
    } finally {
      setActionLoading(false);
    }
  };

  // Restrict Permanent delete and Undo based on level (1 = Admin, 3 = Pimpinan)
  // Or allow operator (2) for Undo if needed, let's keep it visible for all but handled by backend
  const canDeletePermanent = user?.id_level === 1 || user?.id_level === 3;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-main)' }}>Arsip Keamanan</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Log transaksi pakaian yang sudah diambil oleh pelanggan.
          </p>
        </div>
        <button className="btn-primary" onClick={handleDownloadCSV} id="btn-download-csv">
          <Download size={15} /> Unduh CSV
        </button>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div className="search-input-wrapper" style={{ maxWidth: '320px' }}>
            <Search size={15} className="search-icon" />
            <input className="search-input" placeholder="Cari kode order, pelanggan, atau petugas..." value={search}
              onChange={e => setSearch(e.target.value)} id="arsip-search" />
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
                  <th>Detail Order</th>
                  <th>Tanggal Masuk</th>
                  <th>Petugas (PIC)</th>
                  <th>Tanggal Pengambilan</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge badge-blue" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                          {a.order?.order_code}
                        </span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '13px' }}>
                          {formatRupiah(a.order?.total)}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} /> {a.customer?.customer_name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-main)', fontSize: '12.5px' }}>
                        {a.order?.order_date ? new Date(a.order.order_date).toLocaleDateString('id-ID') : '—'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {a.order?.order_date ? new Date(a.order.order_date).toLocaleTimeString('id-ID') : ''}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '6px',
                          background: 'linear-gradient(135deg, var(--color-gradient-primary-1), var(--color-gradient-primary-2))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: 'white',
                        }}>
                          {a.user ? a.user.name[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--color-text-main)', fontSize: '12.5px' }}>{a.user?.name || 'Sistem'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--color-text-main)', fontSize: '12.5px' }}>
                        {new Date(a.pickup_date).toLocaleDateString('id-ID')}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {new Date(a.pickup_date).toLocaleTimeString('id-ID')}
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--color-text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.notes || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-icon" onClick={() => setUndoTarget(a)}
                          style={{ color: '#f59e0b', width: 32, height: 32 }} title="Batalkan Pickup (Undo)">
                          <RotateCcw size={15} />
                        </button>
                        {canDeletePermanent && (
                          <button className="btn-icon" onClick={() => setDeleteTarget(a)}
                            style={{ color: '#f87171', width: 32, height: 32 }} title="Hapus Permanen">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Archive size={36} style={{ opacity: 0.3 }} />
                        <span>Tidak ada arsip ditemukan</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Undo Modal */}
      {undoTarget && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '380px' }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '14px',
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <RotateCcw size={22} style={{ color: '#f59e0b' }} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>Batalkan Pickup?</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Order <strong style={{ color: 'var(--color-text-main)' }}>{undoTarget.order?.order_code}</strong> akan dikembalikan ke status "Baru" (Antri).
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setUndoTarget(null)}>Batal</button>
              <button className="btn-primary" style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }} onClick={handleUndo} disabled={actionLoading}>
                {actionLoading ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <RotateCcw size={14} />} Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {deleteTarget && (
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
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>Hapus Permanen?</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Yakin menghapus arsip <strong style={{ color: 'var(--color-text-main)' }}>{deleteTarget.order?.order_code}</strong> secara permanen? Data order akan dihapus selamanya.
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn-danger" onClick={handlePermanentDelete} disabled={actionLoading}>
                {actionLoading ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Trash2 size={14} />} Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArsipPage;
