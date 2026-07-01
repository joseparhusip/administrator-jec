// path: src/pages/Dokter.jsx
import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import '../css/style.css';

const IMG_URL = import.meta.env.VITE_IMAGE_BASE_URL;
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
});

// ============================================================
// INJECT CSS (Style Banner Info, Pagination, Dynamic Forms & Details)
// ============================================================
if (!document.getElementById('dokter-page-styles')) {
  const style = document.createElement('style');
  style.id = 'dokter-page-styles';
  style.textContent = `
    .dokter-info-banner {
      background: #E8F5E9;
      border: 1px solid #A5D6A7;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      color: #2E7D32;
      margin-bottom: 24px;
      font-weight: 500;
    }
    .pagination-container {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
      margin-top: 24px;
      padding-bottom: 24px;
    }
    .pagination-btn {
      padding: 6px 14px;
      background: #ffffff;
      border: 1.5px solid #E2E8F0;
      color: #64748B;
      font-weight: 600;
      font-size: 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .pagination-btn:hover:not(:disabled) {
      background: #F8FAFC;
      border-color: #CBD5E1;
      color: #334155;
    }
    .pagination-btn.active {
      background: #2E7D32;
      border-color: #2E7D32;
      color: #ffffff;
    }
    .pagination-btn:disabled {
      background: #F1F5F9;
      color: #94A3B8;
      cursor: not-allowed;
      border-color: #E2E8F0;
    }
    
    /* ------------------------------------------- */
    /* UI BARU UNTUK DYNAMIC FORM (PENDIDIKAN & PENGALAMAN) */
    /* ------------------------------------------- */
    .dynamic-form-section {
      margin-top: 24px;
      padding: 20px;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      background: #F8FAFC;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    .dynamic-form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 2px dashed #CBD5E1;
      padding-bottom: 12px;
    }
    .dynamic-form-header h4 {
      margin: 0;
      font-size: 1.1rem;
      color: #1E293B;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .add-row-btn {
      background: #E0F2FE;
      color: #0284C7;
      border: 1px solid #BAE6FD;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .add-row-btn:hover {
      background: #BAE6FD;
      color: #0369A1;
    }
    .dynamic-row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
      align-items: flex-start;
      background: #FFFFFF;
      padding: 14px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      animation: slideIn 0.3s ease-out;
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dynamic-row-inputs {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
    }
    .dynamic-row input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #334155;
      transition: all 0.2s ease;
    }
    .dynamic-row input:focus {
      outline: none;
      border-color: #38BDF8;
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }
    .remove-row-btn {
      background: #FEE2E2;
      color: #DC2626;
      border: 1px solid #FECACA;
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .remove-row-btn:hover {
      background: #FECACA;
      color: #B91C1C;
    }
    .empty-state-text {
      text-align: center;
      font-size: 0.9rem;
      color: #94A3B8;
      font-style: italic;
      padding: 15px 0 5px;
    }

    /* Detail View Styling */
    .detail-section-title {
      font-size: 1.1rem;
      color: #1e293b;
      margin: 25px 0 10px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 5px;
    }
    .detail-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .detail-list li {
      background: #f1f5f9;
      margin-bottom: 8px;
      padding: 10px 15px;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #334155;
    }
  `;
  document.head.appendChild(style);
}

// ── Icons SVG ────────────────────────────────────────────────────
const StethoscopeIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
    <circle cx="20" cy="10" r="2"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);
const BookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);
const BriefcaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
  </svg>
);

// ── Doctor Card ──────────────────────────────────────────────────
function DokterCard({ dokter, onSelect, onEdit, onDelete }) {
  const fotoUrl = dokter.foto ? `${IMG_URL}/${dokter.foto}` : null;

  return (
    <div className="dokter-card" onClick={() => onSelect(dokter)}>
      <div className="dokter-card-photo-wrap">
        {fotoUrl ? (
          <img src={fotoUrl} alt={dokter.nama_dokter} className="dokter-card-photo" />
        ) : (
          <div className="dokter-card-photo-placeholder">
            <StethoscopeIcon />
          </div>
        )}
      </div>
      <div className="dokter-card-body">
        <h3 className="dokter-card-name">{dokter.nama_dokter}</h3>
        <span className="dokter-card-spesialis">{dokter.spesialis}</span>
      </div>
      <div className="dokter-card-actions" onClick={e => e.stopPropagation()}>
        <button className="dokter-action-btn edit" title="Edit" onClick={() => onEdit(dokter)}>
          <EditIcon /> Edit
        </button>
        <button className="dokter-action-btn delete" title="Hapus" onClick={() => onDelete(dokter)}>
          <TrashIcon /> Hapus
        </button>
      </div>
    </div>
  );
}

// ── Detail View ──────────────────────────────────────────────────
function DokterDetail({ dokterId, onBack, onEdit, onDelete }) {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/admin/dokter/${dokterId}`, getAuthHeaders());
        if (res.data.success) {
          setDetailData(res.data.data);
        }
      } catch (err) {
        console.error("Gagal mengambil detail", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [dokterId]);

  if (loading || !detailData) return <div className="users-loading"><div className="users-loading-spinner" /></div>;

  const fotoUrl = detailData.foto ? `${IMG_URL}/${detailData.foto}` : null;

  return (
    <div className="dokter-detail-page">
      <button className="dokter-back-btn" onClick={onBack}>
        <BackIcon /> Kembali ke Daftar Dokter
      </button>

      <div className="dokter-detail-card">
        <div className="dokter-detail-photo-wrap">
          {fotoUrl ? (
            <img src={fotoUrl} alt={detailData.nama_dokter} className="dokter-detail-photo" />
          ) : (
            <div className="dokter-detail-photo-placeholder">
              <StethoscopeIcon />
            </div>
          )}
        </div>
        <div className="dokter-detail-info">
          <div className="dokter-detail-badge">{detailData.spesialis}</div>
          <h1 className="dokter-detail-name">{detailData.nama_dokter}</h1>
          
          <div className="dokter-detail-divider" />

          <h4 className="detail-section-title">Riwayat Pendidikan</h4>
          {detailData.pendidikan && detailData.pendidikan.length > 0 ? (
            <ul className="detail-list">
              {detailData.pendidikan.map(p => (
                <li key={p.id}>
                  <strong>{p.gelar}</strong> - {p.institusi} ({p.tahun_lulus})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Belum ada data pendidikan.</p>
          )}

          <h4 className="detail-section-title">Pengalaman Kerja</h4>
          {detailData.pengalaman && detailData.pengalaman.length > 0 ? (
            <ul className="detail-list">
              {detailData.pengalaman.map(p => (
                <li key={p.id}>
                  <strong>{p.posisi}</strong> di {p.tempat} ({p.tahun_mulai} - {p.tahun_selesai || 'Sekarang'})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Belum ada data pengalaman.</p>
          )}

          <div className="dokter-detail-action-row" style={{ marginTop: '30px' }}>
            <button className="dokter-detail-btn edit" onClick={() => onEdit(detailData)}>
              <EditIcon /> Edit Dokter
            </button>
            <button className="dokter-detail-btn delete" onClick={() => onDelete(detailData)}>
              <TrashIcon /> Hapus Dokter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Form ───────────────────────────────────────────────────
function DokterModal({ mode, dokterId, onClose, onSuccess }) {
  const [namaDokter, setNamaDokter] = useState('');
  const [spesialis, setSpesialis] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  
  const [pendidikan, setPendidikan] = useState([]);
  const [pengalaman, setPengalaman] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && dokterId) {
      setLoading(true);
      api.get(`/admin/dokter/${dokterId}`, getAuthHeaders())
        .then(res => {
          if (res.data.success) {
            const data = res.data.data;
            setNamaDokter(data.nama_dokter);
            setSpesialis(data.spesialis);
            if (data.foto) setFotoPreview(`${IMG_URL}/${data.foto}`);
            if (data.pendidikan) setPendidikan(data.pendidikan);
            if (data.pengalaman) setPengalaman(data.pengalaman);
          }
        })
        .catch(err => {
          console.error(err);
          setError('Gagal mengambil data dokter untuk diedit.');
        })
        .finally(() => setLoading(false));
    }
  }, [mode, dokterId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Format file tidak valid. Hanya JPG, PNG, WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }
    setError('');
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const addPendidikan = () => setPendidikan([...pendidikan, { gelar: '', institusi: '', tahun_lulus: '' }]);
  const removePendidikan = (index) => setPendidikan(pendidikan.filter((_, i) => i !== index));
  const updatePendidikan = (index, field, value) => {
    const newP = [...pendidikan];
    newP[index][field] = value;
    setPendidikan(newP);
  };

  const addPengalaman = () => setPengalaman([...pengalaman, { posisi: '', tempat: '', tahun_mulai: '', tahun_selesai: '' }]);
  const removePengalaman = (index) => setPengalaman(pengalaman.filter((_, i) => i !== index));
  const updatePengalaman = (index, field, value) => {
    const newP = [...pengalaman];
    newP[index][field] = value;
    setPengalaman(newP);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!namaDokter.trim() || !spesialis.trim()) {
      setError('Nama dan spesialisasi wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('nama_dokter', namaDokter.trim());
    formData.append('spesialis', spesialis.trim());
    if (fotoFile) formData.append('foto', fotoFile);

    formData.append('pendidikan', JSON.stringify(pendidikan));
    formData.append('pengalaman', JSON.stringify(pengalaman));

    try {
      if (mode === 'add') {
        await api.post('/admin/dokter', formData, getAuthHeaders());
      } else {
        await api.put(`/admin/dokter/${dokterId}`, formData, getAuthHeaders());
      }
      onSuccess(mode === 'add' ? 'Dokter berhasil ditambahkan!' : 'Dokter berhasil diperbarui!');
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Diperlebar sedikit agar Grid inputannya lebih lega */}
      <div className="modal-content dokter-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'add' ? '+ Tambah Dokter Baru' : '✏️ Edit Dokter'}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {error && <div className="dokter-form-error">{error}</div>}

            <div className="dokter-form-photo-preview">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="dokter-form-preview-img" />
              ) : (
                <div className="dokter-form-preview-placeholder">
                  <StethoscopeIcon />
                  <span>Belum ada foto</span>
                </div>
              )}
            </div>

            <div className="modal-form-group">
              <label>Foto Dokter <span style={{ color: '#aaa', fontSize: '0.8rem' }}>(JPG/PNG/WEBP, maks 5MB)</span></label>
              <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleFileChange} />
            </div>

            <div className="modal-form-group">
              <label>Nama Dokter <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                value={namaDokter}
                onChange={e => setNamaDokter(e.target.value)}
                placeholder="Contoh: Dr. Andhika Guna Dharma, SpM(K)"
                required
              />
            </div>

            <div className="modal-form-group">
              <label>Spesialisasi <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                value={spesialis}
                onChange={e => setSpesialis(e.target.value)}
                placeholder="Contoh: Spesialis Mata (LASIK)"
                required
              />
            </div>

            {/* --- UI BARU: FORM DINAMIS PENDIDIKAN --- */}
            <div className="dynamic-form-section">
              <div className="dynamic-form-header">
                <h4><BookIcon /> Data Pendidikan</h4>
                <button type="button" className="add-row-btn" onClick={addPendidikan}>
                  <PlusIcon /> Tambah
                </button>
              </div>
              {pendidikan.map((item, index) => (
                <div className="dynamic-row" key={index}>
                  <div className="dynamic-row-inputs">
                    <input type="text" placeholder="Gelar (Contoh: Sp.M)" value={item.gelar} onChange={e => updatePendidikan(index, 'gelar', e.target.value)} required />
                    <input type="text" placeholder="Institusi Pendidikan" value={item.institusi} onChange={e => updatePendidikan(index, 'institusi', e.target.value)} required />
                    <input type="number" placeholder="Tahun Lulus" value={item.tahun_lulus} onChange={e => updatePendidikan(index, 'tahun_lulus', e.target.value)} required />
                  </div>
                  <button type="button" className="remove-row-btn" title="Hapus baris ini" onClick={() => removePendidikan(index)}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
              {pendidikan.length === 0 && <div className="empty-state-text">Belum ada data pendidikan ditambahkan.</div>}
            </div>

            {/* --- UI BARU: FORM DINAMIS PENGALAMAN --- */}
            <div className="dynamic-form-section">
              <div className="dynamic-form-header">
                <h4><BriefcaseIcon /> Pengalaman Kerja</h4>
                <button type="button" className="add-row-btn" onClick={addPengalaman}>
                  <PlusIcon /> Tambah
                </button>
              </div>
              {pengalaman.map((item, index) => (
                <div className="dynamic-row" key={index}>
                  <div className="dynamic-row-inputs">
                    <input type="text" placeholder="Posisi/Jabatan" value={item.posisi} onChange={e => updatePengalaman(index, 'posisi', e.target.value)} required />
                    <input type="text" placeholder="Tempat (RS/Klinik)" value={item.tempat} onChange={e => updatePengalaman(index, 'tempat', e.target.value)} required />
                    <input type="number" placeholder="Tahun Mulai" value={item.tahun_mulai} onChange={e => updatePengalaman(index, 'tahun_mulai', e.target.value)} required />
                    <input type="text" placeholder="Tahun Selesai (Kosong = Sekarang)" value={item.tahun_selesai || ''} onChange={e => updatePengalaman(index, 'tahun_selesai', e.target.value)} />
                  </div>
                  <button type="button" className="remove-row-btn" title="Hapus baris ini" onClick={() => removePengalaman(index)}>
                    <TrashIcon />
                  </button>
                </div>
              ))}
              {pengalaman.length === 0 && <div className="empty-state-text">Belum ada data pengalaman ditambahkan.</div>}
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : mode === 'add' ? 'Tambahkan' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
function Dokter() {
  const [dokterList, setDokterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedDokterId, setSelectedDokterId] = useState(null);
  const [modalMode, setModalMode] = useState(null); 
  const [editTargetId, setEditTargetId] = useState(null);
  const [toast, setToast] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  useEffect(() => {
    fetchDokter();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchDokter = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dokter', getAuthHeaders());
      if (res.data.success) setDokterList(res.data.data);
    } catch (err) {
      console.error('Gagal ambil data dokter:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dokter) => {
    if (!window.confirm(`Yakin ingin menghapus Dr. ${dokter.nama_dokter}?`)) return;
    try {
      await api.delete(`/admin/dokter/${dokter.id}`, getAuthHeaders());
      setToast('Dokter berhasil dihapus.');
      setSelectedDokterId(null);
      fetchDokter();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus dokter.');
    }
  };

  const handleOpenEdit = (dokter) => {
    setEditTargetId(dokter.id || dokter);
    setModalMode('edit');
  };

  const handleModalSuccess = (message) => {
    setToast(message);
    setModalMode(null);
    setEditTargetId(null);
    setSelectedDokterId(null);
    fetchDokter();
  };

  const filteredList = dokterList.filter(d =>
    d.nama_dokter.toLowerCase().includes(search.toLowerCase()) ||
    d.spesialis.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentDokters = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (selectedDokterId) {
    return (
      <>
        <DokterDetail
          dokterId={selectedDokterId}
          onBack={() => setSelectedDokterId(null)}
          onEdit={() => handleOpenEdit(selectedDokterId)}
          onDelete={handleDelete}
        />
        {modalMode === 'edit' && editTargetId && (
          <DokterModal mode="edit" dokterId={editTargetId} onClose={() => { setModalMode(null); setEditTargetId(null); }} onSuccess={handleModalSuccess} />
        )}
        {toast && <div className="toast-notification">{toast}</div>}
      </>
    );
  }

  return (
    <div className="crud-page">
      <div className="crud-page-header dokter-header">
        <h1>Manajemen Dokter</h1>
        <div className="crud-header-controls">
          <div className="dokter-search-wrap">
            <SearchIcon />
            <input type="text" className="dokter-search-input" placeholder="Cari nama atau spesialisasi..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="add-button" onClick={() => setModalMode('add')}>
            <PlusIcon /> Tambah Dokter
          </button>
        </div>
      </div>

      {!loading && dokterList.length > 0 && (
        <div className="users-summary-bar">
          <span className="users-count-label">
            Menampilkan <strong>{filteredList.length === 0 ? 0 : indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredList.length)}</strong> dari <strong>{filteredList.length}</strong> dokter
          </span>
        </div>
      )}

      <div className="dokter-info-banner">
        💡 Klik kartu dokter untuk melihat profil lengkap (Pendidikan & Pengalaman).
      </div>

      {loading ? (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat data dokter...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-icon">🩺</div>
          <p>Tidak ada dokter ditemukan.</p>
        </div>
      ) : (
        <>
          <div className="dokter-card-grid">
            {currentDokters.map(d => (
              <DokterCard key={d.id} dokter={d} onSelect={() => setSelectedDokterId(d.id)} onEdit={handleOpenEdit} onDelete={handleDelete} />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination-container">
              <button className="pagination-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                &laquo; Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>
                  {page}
                </button>
              ))}
              <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                Next &raquo;
              </button>
            </div>
          )}
        </>
      )}

      {modalMode === 'add' && <DokterModal mode="add" onClose={() => setModalMode(null)} onSuccess={handleModalSuccess} />}
      {modalMode === 'edit' && editTargetId && <DokterModal mode="edit" dokterId={editTargetId} onClose={() => { setModalMode(null); setEditTargetId(null); }} onSuccess={handleModalSuccess} />}
      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}

export default Dokter;