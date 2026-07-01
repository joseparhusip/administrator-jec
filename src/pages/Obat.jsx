import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance'; // ✅ Ganti axios biasa → axiosInstance (sudah ada baseURL + token otomatis)
import * as XLSX from 'xlsx';
import '../css/style.css';

// ✅ Hanya IMG_URL yang masih dibutuhkan (untuk tampilkan gambar)
const IMG_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const MAX_CHARS = 100;

const ExcelIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 13H16M8 17H16M10 9H14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function DeskripsiTextarea({ name, value, onChange, required, rows = 4 }) {
  const charCount = value.length;
  const isOverLimit = charCount >= MAX_CHARS;
  const isWarning = charCount >= MAX_CHARS * 0.85;

  const handleChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length > MAX_CHARS) {
      onChange({ target: { name, value: newValue.slice(0, MAX_CHARS), type: 'textarea' } });
      return;
    }
    onChange(e);
  };

  const handleKeyDown = (e) => {
    if (charCount >= MAX_CHARS) {
      const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Control', 'Meta', 'Shift', 'Alt', 'CapsLock'];
      if (e.ctrlKey || e.metaKey) return;
      if (!allowedKeys.includes(e.key)) e.preventDefault();
    }
  };

  return (
    <div>
      <textarea
        name={name} value={value} onChange={handleChange} onKeyDown={handleKeyDown}
        required={required} rows={rows}
        style={{
          width: '100%', padding: '0.75rem',
          border: `1.5px solid ${isOverLimit ? '#e53e3e' : isWarning ? '#f6ad55' : '#dee2e6'}`,
          borderRadius: '8px', fontSize: '0.95rem', color: '#212529',
          resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.2s', backgroundColor: isOverLimit ? '#fff5f5' : '#ffffff',
        }}
        placeholder="Tulis deskripsi singkat obat... (maks. 100 huruf)"
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', flexWrap: 'wrap', gap: '4px' }}>
        <div style={{ fontSize: '0.8rem' }}>
          {isOverLimit ? (
            <span style={{ color: '#e53e3e', fontWeight: '600' }}>Batas 100 huruf telah tercapai!</span>
          ) : isWarning ? (
            <span style={{ color: '#c05621', fontWeight: '500' }}>Hampir mencapai batas huruf.</span>
          ) : <span>&nbsp;</span>}
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: isOverLimit ? '#e53e3e' : isWarning ? '#c05621' : '#6c757d', whiteSpace: 'nowrap' }}>
          {charCount} / {MAX_CHARS} huruf
        </span>
      </div>
      <div style={{ marginTop: '4px', height: '4px', borderRadius: '4px', background: '#e9ecef', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min((charCount / MAX_CHARS) * 100, 100)}%`,
          borderRadius: '4px', background: isOverLimit ? '#e53e3e' : isWarning ? '#f6ad55' : '#2e7d32',
          transition: 'width 0.2s, background 0.2s'
        }} />
      </div>
    </div>
  );
}

function InstruksiObat() {
  return (
    <div style={{
      background: '#f0f9f0', border: '1px solid #a5d6a7', borderRadius: '10px',
      padding: '12px 16px', marginBottom: '16px', fontSize: '0.82rem', color: '#2e7d32', lineHeight: '1.7'
    }}>
      <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '0.88rem' }}>Panduan Pengisian Data Obat</div>
      <ul style={{ paddingLeft: '16px', margin: 0 }}>
        <li><strong>Nama Obat:</strong> Tulis nama resmi obat sesuai kemasan (contoh: <em>Paracetamol 500mg</em>).</li>
        <li><strong>Deskripsi:</strong> Isi kegunaan utama obat, maksimal <strong>100 huruf</strong>.</li>
        <li><strong>Harga:</strong> Masukkan harga satuan dalam Rupiah, tanpa titik atau koma.</li>
        <li><strong>Stok:</strong> Masukkan ketersediaan stok fisik obat di apotek.</li>
        <li><strong>Gambar:</strong> Upload foto kemasan obat, format JPG/PNG/WEBP, maks. 500KB.</li>
      </ul>
    </div>
  );
}

function ObatCard({ obat, onViewDetail }) {
  const imageUrl = obat.image_url ? `${IMG_URL}/${obat.image_url}` : null;
  // Logika warna stok
  const isHabis = obat.stok <= 0;

  return (
    <div className="obat-card">
      <div className="obat-card-image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={obat.nama} className="obat-card-image" style={{ filter: isHabis ? 'grayscale(100%)' : 'none' }} />
        ) : (
          <div className="obat-card-image-placeholder">
            <span>💊</span>
          </div>
        )}
      </div>

      <div className="obat-card-info">
        <div className="obat-card-info-row">
          <div className="obat-card-name-wrap">
            <h3 className="obat-card-name">{obat.nama}</h3>
            <p className="obat-card-id" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>ID: {obat.obat_id}</span>
              <span style={{ color: isHabis ? '#e53e3e' : '#2e7d32', fontWeight: 'bold', fontSize: '0.8rem', background: isHabis ? '#fff5f5' : '#e8f5e9', padding: '2px 6px', borderRadius: '4px' }}>
                Stok: {obat.stok}
              </span>
            </p>
          </div>
          <span className="obat-card-price">
            Rp {Number(obat.harga).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      <div className="obat-card-action">
        <button className="obat-card-btn" onClick={() => onViewDetail(obat)}>
          Details Obat
        </button>
      </div>
    </div>
  );
}

function DetailObatModal({ obat, onClose, onEdit, onDelete }) {
  if (!obat) return null;
  const imageUrl = obat.image_url ? `${IMG_URL}/${obat.image_url}` : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal-container" onClick={e => e.stopPropagation()}>
        <div className="detail-modal-hero obat-hero">
          <div className="obat-detail-image-wrap">
            {imageUrl ? (
              <img src={imageUrl} alt={obat.nama} className="obat-detail-image" />
            ) : (
              <div className="obat-detail-image-placeholder">Obat</div>
            )}
          </div>
          <div className="detail-modal-hero-info">
            <div className="detail-modal-id">ID #{obat.obat_id}</div>
            <h2 className="detail-modal-name">{obat.nama}</h2>
            <div className="obat-detail-price">
              Rp {Number(obat.harga).toLocaleString('id-ID')}
            </div>
          </div>
          <button className="modal-close-btn detail-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="detail-modal-body">
          <div className="detail-section">
            <h3>Deskripsi</h3>
            <p style={{ fontSize: '0.95rem', color: '#343a40', lineHeight: 1.7, margin: 0 }}>
              {obat.deskripsi || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>Tidak ada deskripsi</span>}
            </p>
          </div>

          <div className="detail-section">
            <h3>Info Produk</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">ID Obat</span>
                <span className="detail-value">#{obat.obat_id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Harga Satuan</span>
                <span className="detail-value">Rp {Number(obat.harga).toLocaleString('id-ID')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sisa Stok</span>
                <span className="detail-value" style={{ color: obat.stok <= 0 ? '#e53e3e' : '#2e7d32' }}>
                  {obat.stok} Pcs
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gambar</span>
                <span className="detail-value">{obat.image_url ? 'Tersedia' : 'Tidak Ada'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Tutup</button>
          <button className="btn-edit-modal" onClick={() => onEdit(obat)}>Edit Obat</button>
          <button className="btn-danger" onClick={() => onDelete(obat)}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

function Obat() {
  const [obatData, setObatData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const [viewingObat, setViewingObat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // ✅ Tambahkan property stok
  const [formData, setFormData] = useState({ nama: '', deskripsi: '', harga: '', stok: '', image_file: null });
  const [addImagePreview, setAddImagePreview] = useState(null);
  
  const [selectedObat, setSelectedObat] = useState(null);
  const [editFormData, setEditFormData] = useState({ obat_id: '', nama: '', deskripsi: '', harga: '', stok: '', image_file: null });
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [currentImagePath, setCurrentImagePath] = useState('');
  
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 500 * 1024;
    if (!allowedTypes.includes(file.type)) { alert('Format gambar tidak didukung! Hanya JPG, PNG, dan WEBP.'); return false; }
    if (file.size > maxSize) { alert(`Ukuran gambar terlalu besar! Maksimal 500KB. Anda: ${(file.size / 1024).toFixed(0)}KB.`); return false; }
    return true;
  };

  const fetchObatData = async () => {
    setLoading(true);
    setError(null);
    try {


      // ✅ Pakai api (axiosInstance) — baseURL + token sudah otomatis
      const response = await api.get('/admin/obat');
      setObatData(response.data.data || []);
    } catch (err) {
      console.error("Error fetching obat:", err.response?.status, err.config?.url);
      setError('Gagal memuat data obat. Pastikan Anda sudah login.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchObatData(); }, []);
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (!file) return;
      if (!validateImageFile(file)) { e.target.value = ''; setAddImagePreview(null); return; }
      setFormData(prev => ({ ...prev, image_file: file }));
      setAddImagePreview(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_file) { alert("Gambar obat wajib diisi!"); return; }
    const data = new FormData();
    data.append('nama', formData.nama);
    data.append('deskripsi', formData.deskripsi);
    data.append('harga', formData.harga);
    data.append('stok', formData.stok); // ✅ Push stok
    data.append('image_url', formData.image_file);
    try {
      // ✅ Pakai api (axiosInstance), Content-Type multipart otomatis dideteksi
      await api.post('/admin/obat', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setToastMessage('Data obat baru berhasil ditambahkan.');
      setIsModalOpen(false);
      setFormData({ nama: '', deskripsi: '', harga: '', stok: '', image_file: null });
      setAddImagePreview(null);
      fetchObatData();
    } catch (err) {
      console.error("Error creating data:", err);
      setError('Gagal menyimpan data obat. Cek konsol.');
    }
  };

  const handleOpenEditModal = (obat) => {
    setViewingObat(null);
    setSelectedObat(obat);
    setEditFormData({ 
      obat_id: obat.obat_id, 
      nama: obat.nama, 
      deskripsi: obat.deskripsi, 
      harga: obat.harga, 
      stok: obat.stok, // ✅ Set stok untuk form
      image_file: null 
    });
    setCurrentImagePath(obat.image_url);
    setEditImagePreview(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => { setIsEditModalOpen(false); setSelectedObat(null); };

  const handleEditFormChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (!file) return;
      if (!validateImageFile(file)) { e.target.value = ''; setEditImagePreview(null); return; }
      setEditFormData(prev => ({ ...prev, image_file: file }));
      setEditImagePreview(URL.createObjectURL(file));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('nama', editFormData.nama);
    data.append('deskripsi', editFormData.deskripsi);
    data.append('harga', editFormData.harga);
    data.append('stok', editFormData.stok); // ✅ Push Stok
    if (editFormData.image_file) data.append('image_url', editFormData.image_file);
    try {
      // ✅ Pakai api (axiosInstance)
      await api.put(`/admin/obat/${editFormData.obat_id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setToastMessage('Data obat berhasil diperbarui.');
      handleCloseEditModal();
      fetchObatData();
    } catch (err) {
      console.error("Error updating data:", err);
      setError('Gagal memperbarui data obat. Cek konsol.');
    }
  };

  const handleOpenConfirmModal = (obat) => {
    setViewingObat(null);
    setItemToDelete(obat);
    setIsConfirmModalOpen(true);
  };
  const handleCloseConfirmModal = () => { setItemToDelete(null); setIsConfirmModalOpen(false); };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      // ✅ Pakai api (axiosInstance)
      await api.delete(`/admin/obat/${itemToDelete.obat_id}`);
      setToastMessage('Data obat berhasil dihapus');
      handleCloseConfirmModal();
      fetchObatData();
    } catch (err) {
      console.error("Error deleting data:", err);
      setError('Gagal menghapus data obat. Cek konsol.');
    }
  };

  // ── EXPORT EXCEL ──────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (filteredObat.length === 0) { setToastMessage('Tidak ada data untuk diekspor.'); return; }
    setIsExporting(true);
    try {
      const rows = filteredObat.map((obat, idx) => ({
        'No': idx + 1,
        'ID Obat': obat.obat_id,
        'Nama Obat': obat.nama || '-',
        'Deskripsi': obat.deskripsi || '-',
        'Harga (Rp)': Number(obat.harga) || 0,
        'Sisa Stok': Number(obat.stok) || 0, // ✅ Masukkan stok ke Excel
        'Harga Teks': `Rp ${Number(obat.harga).toLocaleString('id-ID')}`,
        'Ada Gambar': obat.image_url ? 'Ya' : 'Tidak',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 5 }, { wch: 10 }, { wch: 28 },
        { wch: 40 }, { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 12 },
      ];

      const totalStok = obatData.reduce((a, o) => a + (Number(o.stok) || 0), 0);
      const ringkasan = [
        { 'Keterangan': 'Total Jenis Obat', 'Nilai': obatData.length },
        { 'Keterangan': 'Total Keseluruhan Stok (Pcs)', 'Nilai': totalStok },
        { 'Keterangan': 'Obat Stok Habis', 'Nilai': obatData.filter(o => o.stok <= 0).length },
        { 'Keterangan': 'Harga Rata-rata (Rp)', 'Nilai': `Rp ${Math.round(obatData.reduce((a, o) => a + Number(o.harga), 0) / (obatData.length || 1)).toLocaleString('id-ID')}` },
        { 'Keterangan': 'Diekspor Pada', 'Nilai': new Date().toLocaleString('id-ID') },
      ];
      const wsRing = XLSX.utils.json_to_sheet(ringkasan);
      wsRing['!cols'] = [{ wch: 28 }, { wch: 28 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Obat');
      XLSX.utils.book_append_sheet(wb, wsRing, 'Ringkasan');
      XLSX.writeFile(wb, `Data_Obat_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setToastMessage('Data berhasil diekspor ke Excel!');
    } catch (err) {
      console.error('Gagal mengekspor data obat:', err);
      setToastMessage('Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredObat = obatData.filter(obat => obat.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="crud-page">
      {/* ── HEADER ── */}
      <div className="crud-page-header">
        <h1>Manajemen Obat</h1>
        <div className="crud-header-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Cari berdasarkan nama obat..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExporting || loading || filteredObat.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px', backgroundColor: '#1D6F42',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '0.855rem', fontWeight: '700', cursor: 'pointer',
              opacity: (isExporting || loading || filteredObat.length === 0) ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(29,111,66,0.28)', transition: 'background-color 0.2s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            title="Export data obat ke Excel"
          >
            <ExcelIcon />
            {isExporting ? 'Mengekspor...' : 'Export Excel'}
          </button>

          <button className="add-button" onClick={() => setIsModalOpen(true)}>
            <span>+</span> Tambah Obat
          </button>
        </div>
      </div>

      {/* ── SUMMARY ── */}
      <div className="users-summary-bar">
        <span className="users-count-label">
          Menampilkan <strong>{filteredObat.length}</strong> dari <strong>{obatData.length}</strong> obat
        </span>
      </div>

      {/* ── CARD GRID ── */}
      {loading && (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat data obat...</p>
        </div>
      )}
      {error && <div className="users-error">{error}</div>}
      {!loading && !error && filteredObat.length === 0 && (
        <div className="users-empty">
          <div className="users-empty-icon">💊</div>
          <p>Tidak ada obat ditemukan</p>
          {searchTerm && <small>Coba kata kunci lain</small>}
        </div>
      )}
      {!loading && !error && (
        <div className="obat-card-grid">
          {filteredObat.map(obat => (
            <ObatCard key={obat.obat_id} obat={obat} onViewDetail={setViewingObat} />
          ))}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {viewingObat && (
        <DetailObatModal
          obat={viewingObat}
          onClose={() => setViewingObat(null)}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenConfirmModal}
        />
      )}

      {/* ── MODAL TAMBAH ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Obat Baru</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <InstruksiObat />
                <div className="modal-form-group">
                  <label>Nama Obat</label>
                  <input type="text" name="nama" value={formData.nama} onChange={handleFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Deskripsi</label>
                  <DeskripsiTextarea name="deskripsi" value={formData.deskripsi} onChange={handleFormChange} required rows={4} />
                </div>
                <div className="form-grid">
                  <div className="modal-form-group">
                    <label>Harga (Rp)</label>
                    <input type="number" name="harga" value={formData.harga} onChange={handleFormChange} required min="1" />
                  </div>
                  {/* ✅ Input Stok Tambah */}
                  <div className="modal-form-group">
                    <label>Stok Tersedia (Pcs)</label>
                    <input type="number" name="stok" value={formData.stok} onChange={handleFormChange} required min="0" />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Gambar <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                  <input type="file" name="image_url_file" onChange={handleFormChange} accept=".jpg,.jpeg,.png,.webp" required />
                  {addImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview:</p>
                      <img src={addImagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT ── */}
      {isEditModalOpen && selectedObat && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Obat: {selectedObat.nama}</h2>
              <button type="button" className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <InstruksiObat />
                <div className="modal-form-group">
                  <label>Nama Obat</label>
                  <input type="text" name="nama" value={editFormData.nama} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Deskripsi</label>
                  <DeskripsiTextarea name="deskripsi" value={editFormData.deskripsi} onChange={handleEditFormChange} required rows={4} />
                </div>
                <div className="form-grid">
                  <div className="modal-form-group">
                    <label>Harga (Rp)</label>
                    <input type="number" name="harga" value={editFormData.harga} onChange={handleEditFormChange} required min="1" />
                  </div>
                  {/* ✅ Input Stok Edit */}
                  <div className="modal-form-group">
                    <label>Stok Tersedia (Pcs)</label>
                    <input type="number" name="stok" value={editFormData.stok} onChange={handleEditFormChange} required min="0" />
                  </div>
                </div>
                <div className="modal-form-group">
                  <label>Gambar Saat Ini</label>
                  {currentImagePath ? (
                    <img src={`${IMG_URL}/${currentImagePath}`} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
                  ) : <span style={{ color: '#adb5bd', fontSize: '0.9rem' }}>Tidak ada gambar</span>}
                </div>
                <div className="modal-form-group">
                  <label>Ganti Gambar (Opsional) <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                  <input type="file" name="edit_image_url_file" onChange={handleEditFormChange} accept=".jpg,.jpeg,.png,.webp" />
                  {editImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview gambar baru:</p>
                      <img src={editImagePreview} alt="Preview Baru" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseEditModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL HAPUS ── */}
      {isConfirmModalOpen && (
        <div className="modal-overlay confirmation-modal" onClick={handleCloseConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button type="button" className="modal-close-btn" onClick={handleCloseConfirmModal}>×</button>
            <div className="modal-body">
              <div className="modal-icon">⚠️</div>
              <div className="modal-body-content">
                <h2>Konfirmasi Hapus</h2>
                <p>Apakah Anda yakin ingin menghapus obat: <strong>{itemToDelete?.nama}</strong>?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCloseConfirmModal}>Batal</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div className="toast-notification">{toastMessage}</div>}
    </div>
  );
}

export default Obat;