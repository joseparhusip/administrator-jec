// path: src/pages/Dokter.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/style.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;   // http://…/api
const IMG_URL = import.meta.env.VITE_IMAGE_BASE_URL; // http://…  (untuk path gambar)
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
});

// ============================================================
// INJECT CSS (Style Banner Info & Pagination)
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
    
    /* --- CSS Pagination --- */
    .pagination-container {
      display: flex;
      justify-content: flex-end; /* Posisi di pojok kanan */
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
  `;
  document.head.appendChild(style);
}

// ── Stethoscope Icon SVG ─────────────────────────────────────────
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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <button
          className="dokter-action-btn edit"
          title="Edit"
          onClick={() => onEdit(dokter)}
        >
          <EditIcon /> Edit
        </button>
        <button
          className="dokter-action-btn delete"
          title="Hapus"
          onClick={() => onDelete(dokter)}
        >
          <TrashIcon /> Hapus
        </button>
      </div>
    </div>
  );
}

// ── Detail View ──────────────────────────────────────────────────
function DokterDetail({ dokter, onBack, onEdit, onDelete }) {
  const fotoUrl = dokter.foto ? `${IMG_URL}/${dokter.foto}` : null;

  return (
    <div className="dokter-detail-page">
      <button className="dokter-back-btn" onClick={onBack}>
        <BackIcon /> Kembali ke Daftar Dokter
      </button>

      <div className="dokter-detail-card">
        <div className="dokter-detail-photo-wrap">
          {fotoUrl ? (
            <img src={fotoUrl} alt={dokter.nama_dokter} className="dokter-detail-photo" />
          ) : (
            <div className="dokter-detail-photo-placeholder">
              <StethoscopeIcon />
            </div>
          )}
        </div>
        <div className="dokter-detail-info">
          <div className="dokter-detail-badge">{dokter.spesialis}</div>
          <h1 className="dokter-detail-name">{dokter.nama_dokter}</h1>
          <p className="dokter-detail-id">ID Dokter: <strong>#{dokter.id}</strong></p>

          <div className="dokter-detail-divider" />

          <div className="dokter-detail-meta">
            <div className="dokter-meta-item">
              <span className="dokter-meta-label">Nama Lengkap</span>
              <span className="dokter-meta-value">{dokter.nama_dokter}</span>
            </div>
            <div className="dokter-meta-item">
              <span className="dokter-meta-label">Spesialisasi</span>
              <span className="dokter-meta-value">{dokter.spesialis}</span>
            </div>
            <div className="dokter-meta-item">
              <span className="dokter-meta-label">Foto File</span>
              <span className="dokter-meta-value" style={{ fontSize: '0.8rem', color: '#888' }}>
                {dokter.foto || 'Tidak ada foto'}
              </span>
            </div>
          </div>

          <div className="dokter-detail-action-row">
            <button className="dokter-detail-btn edit" onClick={() => onEdit(dokter)}>
              <EditIcon /> Edit Dokter
            </button>
            <button className="dokter-detail-btn delete" onClick={() => onDelete(dokter)}>
              <TrashIcon /> Hapus Dokter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Form ───────────────────────────────────────────────────
function DokterModal({ mode, dokter, onClose, onSuccess }) {
  const [namaDokter, setNamaDokter] = useState(dokter?.nama_dokter || '');
  const [spesialis, setSpesialis] = useState(dokter?.spesialis || '');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(dokter?.foto ? `${IMG_URL}/${dokter.foto}` : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    try {
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      };

      if (mode === 'add') {
        await axios.post(`${API_URL}/admin/dokter`, formData, { headers });
      } else {
        await axios.put(`${API_URL}/admin/dokter/${dokter.id}`, formData, { headers });
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
      <div className="modal-content dokter-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'add' ? '+ Tambah Dokter Baru' : '✏️ Edit Dokter'}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="dokter-form-error">{error}</div>}

            {/* Preview Foto */}
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
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                {...(mode === 'add' ? { required: true } : {})}
              />
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
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Batal
            </button>
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
  const [selectedDokter, setSelectedDokter] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState('');

  // ── State untuk Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4; // Menampilkan 4 data per halaman

  useEffect(() => {
    fetchDokter();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Reset ke halaman 1 jika user melakukan pencarian
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const fetchDokter = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/dokter`, getAuthHeaders());
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
      await axios.delete(`${API_URL}/admin/dokter/${dokter.id}`, getAuthHeaders());
      setToast('Dokter berhasil dihapus.');
      setSelectedDokter(null);
      fetchDokter();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus dokter.');
    }
  };

  const handleOpenEdit = (dokter) => {
    setEditTarget(dokter);
    setModalMode('edit');
  };

  const handleModalSuccess = (message) => {
    setToast(message);
    setModalMode(null);
    setEditTarget(null);
    setSelectedDokter(null);
    fetchDokter();
  };

  // ── Logika Filter & Pagination ──
  const filteredList = dokterList.filter(d =>
    d.nama_dokter.toLowerCase().includes(search.toLowerCase()) ||
    d.spesialis.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentDokters = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // ── Detail View ──
  if (selectedDokter) {
    return (
      <>
        <DokterDetail
          dokter={selectedDokter}
          onBack={() => setSelectedDokter(null)}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
        {modalMode === 'edit' && editTarget && (
          <DokterModal
            mode="edit"
            dokter={editTarget}
            onClose={() => { setModalMode(null); setEditTarget(null); }}
            onSuccess={handleModalSuccess}
          />
        )}
        {toast && <div className="toast-notification">{toast}</div>}
      </>
    );
  }

  // ── Card Grid View ──
  return (
    <div className="crud-page">

      {/* ── Header: Judul + Search + Tombol Tambah ── */}
      <div className="crud-page-header dokter-header">
        <h1>Manajemen Dokter</h1>
        <div className="crud-header-controls">
          <div className="dokter-search-wrap">
            <SearchIcon />
            <input
              type="text"
              className="dokter-search-input"
              placeholder="Cari nama atau spesialisasi..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={() => setModalMode('add')}>
            <PlusIcon /> Tambah Dokter
          </button>
        </div>
      </div>

      {/* ── Sub-info: Count (diperbarui untuk menunjukkan indikator halaman) ── */}
      {!loading && dokterList.length > 0 && (
        <div className="users-summary-bar">
          <span className="users-count-label">
            Menampilkan <strong>{filteredList.length === 0 ? 0 : indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredList.length)}</strong> dari <strong>{filteredList.length}</strong> dokter
          </span>
        </div>
      )}

      {/* ── Hint Banner ── */}
      <div className="dokter-info-banner">
        💡 Klik kartu dokter untuk mengetahui detail dokternya.
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat data dokter...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-icon">🩺</div>
          <p>Tidak ada dokter ditemukan.</p>
          {search && <small>Coba ubah kata kunci pencarian Anda.</small>}
        </div>
      ) : (
        <>
          <div className="dokter-card-grid">
            {/* Ganti filteredList dengan currentDokters agar hanya merender 4 */}
            {currentDokters.map(d => (
              <DokterCard
                key={d.id}
                dokter={d}
                onSelect={setSelectedDokter}
                onEdit={handleOpenEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
          
          {/* ── Kontrol Pagination ── */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="pagination-btn" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &laquo; Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="pagination-btn" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next &raquo;
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Tambah */}
      {modalMode === 'add' && (
        <DokterModal
          mode="add"
          onClose={() => setModalMode(null)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Modal Edit */}
      {modalMode === 'edit' && editTarget && (
        <DokterModal
          mode="edit"
          dokter={editTarget}
          onClose={() => { setModalMode(null); setEditTarget(null); }}
          onSuccess={handleModalSuccess}
        />
      )}

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}

export default Dokter;