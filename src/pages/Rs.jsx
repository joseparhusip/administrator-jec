// path: src/pages/Rs.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import '../css/style.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const IMG_URL = import.meta.env.VITE_IMAGE_BASE_URL;
const TOKEN = localStorage.getItem('adminToken');
const authHeaders = { headers: { 'Authorization': `Bearer ${TOKEN}` } };
const TYPE_OPTIONS = ['Rumah Sakit', 'Klinik'];

// ============================================================
// INJECT CSS (Pagination)
// ============================================================
if (!document.getElementById('pagination-styles')) {
  const style = document.createElement('style');
  style.id = 'pagination-styles';
  style.textContent = `
    .pagination-container {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
      margin-top: 16px;
      padding-bottom: 0px;
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

// ── RS Selector Card ─────────────────────────────────────────────
function RsCard({ rs, onViewDetail }) {
  const imageUrl = rs.image ? `${IMG_URL}/${rs.image}` : null;
  const badgeClass = rs.type === 'Rumah Sakit' ? 'rs' : 'klinik';

  return (
    <div className="rs-card" onClick={() => onViewDetail(rs)}>
      <div className="rs-card-image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={rs.title} className="rs-card-image" />
        ) : (
          <div className="rs-card-image-placeholder">🏥</div>
        )}
      </div>
      <div className="rs-card-body">
        <h3 className="rs-card-title">{rs.title}</h3>
        <p className="rs-card-location">{rs.location}</p>
        <span className={`rs-card-badge ${badgeClass}`}>{rs.type}</span>
      </div>
    </div>
  );
}

// ── Detail Modal ────────────────────────────────────────────────
function DetailRsModal({ rs, onClose, onEdit, onDelete }) {
  if (!rs) return null;
  const imageUrl = rs.image ? `${IMG_URL}/${rs.image}` : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content detail-modal-container" onClick={e => e.stopPropagation()}>
        <div className="rs-detail-hero">
          <div className="rs-detail-image-wrap">
            {imageUrl ? (
              <img src={imageUrl} alt={rs.title} className="rs-detail-image" />
            ) : (
              <div className="rs-detail-image-placeholder">🏥</div>
            )}
          </div>
          <div className="rs-detail-hero-info">
            <div className="rs-detail-hero-id">ID #{rs.id}</div>
            <h2 className="rs-detail-hero-title">{rs.title}</h2>
            <p className="rs-detail-hero-location">{rs.location}</p>
          </div>
          <button className="modal-close-btn detail-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="detail-modal-body">
          <div className="detail-section">
            <h3>Deskripsi</h3>
            <p style={{ fontSize: '0.95rem', color: '#343a40', lineHeight: 1.7, margin: 0 }}>
              {rs.description || <span style={{ color: '#adb5bd', fontStyle: 'italic' }}>Tidak ada deskripsi</span>}
            </p>
          </div>
          <div className="detail-section">
            <h3>Info Fasilitas</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">ID</span>
                <span className="detail-value">#{rs.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tipe</span>
                <span className="detail-value">{rs.type}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Lokasi</span>
                <span className="detail-value">{rs.location}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Tutup</button>
          <button className="btn-edit-modal" onClick={() => onEdit(rs)}>Edit</button>
          <button className="btn-danger" onClick={() => onDelete(rs)}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
function Rs() {
  const [rsData, setRsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewingRs, setViewingRs] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Form Tambah
  const [formData, setFormData] = useState({ title: '', location: '', type: '', description: '' });
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  // Form Edit
  const [selectedRs, setSelectedRs] = useState(null);
  const [editFormData, setEditFormData] = useState({ id: '', title: '', location: '', type: '', description: '' });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [currentImagePath, setCurrentImagePath] = useState('');

  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const fetchRsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/admin/fasilitas`, authHeaders);
      setRsData(response.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
      setError('Gagal memuat data. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRsData();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format gambar tidak didukung! Hanya JPG, PNG, dan WEBP yang diperbolehkan.');
      return false;
    }
    if (file.size > 500 * 1024) {
      alert(`Ukuran gambar terlalu besar! Maksimal 500KB. Ukuran file Anda: ${(file.size / 1024).toFixed(0)}KB.`);
      return false;
    }
    return true;
  };

  // Handler Tambah
  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateImageFile(file)) {
      e.target.value = '';
      setNewImageFile(null);
      setNewImagePreview(null);
      return;
    }
    setNewImageFile(file);
    setNewImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newImageFile) {
      alert("Gambar fasilitas wajib diisi!");
      return;
    }
    if (!formData.type) {
      alert("Silakan pilih Tipe Fasilitas!");
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('location', formData.location);
    data.append('type', formData.type);
    data.append('description', formData.description);
    data.append('image', newImageFile);

    try {
      await axios.post(`${API_URL}/admin/fasilitas`, data, {
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' }
      });
      setToastMessage('Data berhasil ditambahkan.');
      setIsModalOpen(false);
      setFormData({ title: '', location: '', type: '', description: '' });
      setNewImageFile(null);
      setNewImagePreview(null);
      fetchRsData();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan data.');
    }
  };

  // Handler Edit
  const handleOpenEditModal = (rs) => {
    setViewingRs(null);
    setSelectedRs(rs);
    setEditFormData({
      id: rs.id,
      title: rs.title,
      location: rs.location,
      type: rs.type,
      description: rs.description
    });
    setCurrentImagePath(rs.image);
    setEditImageFile(null);
    setEditImagePreview(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRs(null);
  };

  const handleEditFormChange = (e) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateImageFile(file)) {
      e.target.value = '';
      setEditImageFile(null);
      setEditImagePreview(null);
      return;
    }
    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', editFormData.title);
    data.append('location', editFormData.location);
    data.append('type', editFormData.type);
    data.append('description', editFormData.description);
    if (editImageFile) {
      data.append('image', editImageFile);
    }

    try {
      await axios.put(`${API_URL}/admin/fasilitas/${editFormData.id}`, data, {
        headers: { ...authHeaders.headers, 'Content-Type': 'multipart/form-data' }
      });
      setToastMessage('Data berhasil diperbarui.');
      handleCloseEditModal();
      fetchRsData();
    } catch (err) {
      console.error(err);
      setError('Gagal memperbarui data.');
    }
  };

  // Handler Delete
  const handleOpenConfirmModal = (rs) => {
    setViewingRs(null);
    setItemToDelete(rs);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setItemToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${API_URL}/admin/fasilitas/${itemToDelete.id}`, authHeaders);
      setToastMessage('Data berhasil dihapus');
      handleCloseConfirmModal();
      fetchRsData();
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus data.');
    }
  };

  const uniqueTypes = useMemo(() => {
    return ['Semua', ...new Set(rsData.map(item => item.type).filter(Boolean))];
  }, [rsData]);

  const filteredRs = rsData.filter(rs => {
    const matchesSearch = rs.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Semua' || rs.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredRs.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentRsList = filteredRs.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="crud-page">
      <div className="crud-page-header">
        <h1>Manajemen Rumah Sakit dan Klinik</h1>
        
        {/* ── SEJAJAR SATU BARIS ── */}
        <div className="crud-header-controls" style={{ flexWrap: 'nowrap', width: '100%', justifyContent: 'flex-end', display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          <div className="custom-dropdown-wrapper" style={{ minWidth: '160px' }}>
            <select className="modern-filter-dropdown" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              {uniqueTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="search-container" style={{ flex: 1 }}>
            <input 
              type="text" 
              placeholder="Cari nama fasilitas..." 
              className="search-input" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ width: '100%' }} 
            />
          </div>

          <button className="add-button" onClick={() => setIsModalOpen(true)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            + Tambah Data
          </button>
        </div>
      </div>

      <div className="users-summary-bar">
        <span className="users-count-label">
          Menampilkan <strong>{filteredRs.length === 0 ? 0 : indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredRs.length)}</strong> dari <strong>{filteredRs.length}</strong> fasilitas
        </span>
      </div>

      {loading && (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat data fasilitas...</p>
        </div>
      )}

      {error && <div className="users-error">{error}</div>}

      {!loading && !error && filteredRs.length === 0 && (
        <div className="users-empty">
          <div className="users-empty-icon">🏥</div>
          <p>Tidak ada fasilitas ditemukan</p>
        </div>
      )}

      {!loading && !error && filteredRs.length > 0 && (
        <>
          <div className="rs-card-grid">
            {currentRsList.map(rs => (
              <RsCard key={rs.id} rs={rs} onViewDetail={setViewingRs} />
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

      {/* ── MODAL DETAIL ── */}
      {viewingRs && (
        <DetailRsModal 
          rs={viewingRs} 
          onClose={() => setViewingRs(null)} 
          onEdit={handleOpenEditModal} 
          onDelete={handleOpenConfirmModal} 
        />
      )}
      
      {/* ── MODAL TAMBAH ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Fasilitas Baru</h2>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Nama Fasilitas</label>
                  <input type="text" name="title" value={formData.title} onChange={handleFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Lokasi</label>
                  <input type="text" name="location" value={formData.location} onChange={handleFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Tipe</label>
                  <select name="type" value={formData.type} onChange={handleFormChange} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da' }}>
                    <option value="" disabled>-- Pilih Tipe --</option>
                    {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Deskripsi</label>
                  <textarea name="description" value={formData.description} onChange={handleFormChange} required rows="4" />
                </div>
                <div className="modal-form-group">
                  <label>Gambar</label>
                  <input type="file" name="image" onChange={handleFileChange} required accept=".jpg,.jpeg,.png,.webp" />
                  {newImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '5px' }}>Preview:</p>
                      <img src={newImagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', border: '1px solid #dee2e6' }} />
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
      {isEditModalOpen && selectedRs && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit: {selectedRs.title}</h2>
              <button type="button" className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Nama Fasilitas</label>
                  <input type="text" name="title" value={editFormData.title} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Lokasi</label>
                  <input type="text" name="location" value={editFormData.location} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Tipe</label>
                  <select name="type" value={editFormData.type} onChange={handleEditFormChange} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ced4da' }}>
                    {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="modal-form-group">
                  <label>Deskripsi</label>
                  <textarea name="description" value={editFormData.description} onChange={handleEditFormChange} required rows="4" />
                </div>
                <div className="modal-form-group">
                  <label>Ganti Gambar <span style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 'normal' }}>(Opsional)</span></label>
                  {currentImagePath && !editImagePreview && (
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '5px' }}>Gambar Saat Ini:</p>
                      <img src={`${IMG_URL}/${currentImagePath}`} alt="Current" style={{ maxHeight: '100px', borderRadius: '8px', border: '1px solid #dee2e6' }} />
                    </div>
                  )}
                  <input type="file" name="image" onChange={handleEditFileChange} accept=".jpg,.jpeg,.png,.webp" />
                  {editImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '5px' }}>Preview Gambar Baru:</p>
                      <img src={editImagePreview} alt="Preview Baru" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', border: '1px solid #dee2e6' }} />
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
                <p>Apakah Anda yakin ingin menghapus: <strong>{itemToDelete?.title}</strong>?</p>
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

export default Rs;