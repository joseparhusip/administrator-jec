import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import '../css/style.css';

// ✅ API URL dihandle oleh axiosInstance
const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

// ── Promo Selector Card (mirip RsSelectorCard) ───────────────────
function PromoCard({ promo, onSelect }) {
  const imageUrl = promo.image ? `${BASE_URL}/${promo.image}` : null;
  const isActive = new Date(promo.valid_until) >= new Date();

  return (
    <div className="rs-card promo-rs-card promo-card" onClick={() => onSelect(promo)}>
      <div className="rs-card-image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={promo.title} className="rs-card-image" />
        ) : (
          <div className="rs-card-image-placeholder">🎫</div>
        )}
      </div>
      <div className="rs-card-body">
        <h3 className="rs-card-title">{promo.title}</h3>
        <p className="rs-card-location">{promo.description}</p>
        <span className={`rs-card-badge ${isActive ? 'promo-badge-active' : 'promo-badge-expired'}`}>
          {isActive ? '✅ Aktif' : '⏰ Expired'}
        </span>
      </div>
    </div>
  );
}

function Promo() {
  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal tambah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    kode: '',
    deskripsi: '',
    valid_until: '',
    image: null
  });
  const [addImagePreview, setAddImagePreview] = useState(null);

  // Modal edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    kode: '',
    deskripsi: '',
    valid_until: '',
    image: null,
    currentImage: ''
  });
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Modal detail (card klik)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailPromo, setDetailPromo] = useState(null);

  // Modal konfirmasi hapus
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'

  // Gunakan useCallback agar tidak menyebabkan re-render saat dimasukkan ke dependency
  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  }, []);

  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 500 * 1024;
    if (!allowedTypes.includes(file.type)) {
      alert('Format gambar tidak didukung! Hanya JPG, PNG, dan WEBP yang diperbolehkan.');
      return false;
    }
    if (file.size > maxSize) {
      alert(`Ukuran gambar terlalu besar! Maksimal 500KB. Ukuran file Anda: ${(file.size / 1024).toFixed(0)}KB.`);
      return false;
    }
    return true;
  };

  // Gunakan useCallback untuk mengatasi warning eslint exhaustive-deps
  const fetchPromos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/promos');
      if (response.data.success) {
        setPromos(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching promos:', error);
      showToast(`Error: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // ── Tambah ──
  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      if (!file) return;
      if (!validateImageFile(file)) { e.target.value = ''; setAddImagePreview(null); return; }
      setFormData(prev => ({ ...prev, image: file }));
      setAddImagePreview(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ kode: '', deskripsi: '', valid_until: '', image: null });
    setAddImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('kode', formData.kode);
    data.append('deskripsi', formData.deskripsi);
    data.append('valid_until', formData.valid_until);
    data.append('image', formData.image);
    try {
      const response = await api.post('/admin/promos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        showToast('Promo baru berhasil ditambahkan.');
        fetchPromos();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error creating promo:', error);
      showToast(`Error: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // ── Detail (klik card) ──
  const handleOpenDetail = (promo) => {
    setDetailPromo(promo);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setDetailPromo(null);
  };

  // ── Edit ──
  const handleOpenEditModal = (promo) => {
    // Tutup detail dulu kalau lagi buka
    setIsDetailModalOpen(false);
    setDetailPromo(null);

    setSelectedPromo(promo);
    const validDate = promo.valid_until
      ? new Date(promo.valid_until).toISOString().split('T')[0]
      : '';
    setEditFormData({
      id: promo.id,
      kode: promo.title,
      deskripsi: promo.description,
      valid_until: validDate,
      image: null,
      currentImage: promo.image
    });
    setEditImagePreview(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedPromo(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      if (!file) return;
      if (!validateImageFile(file)) { e.target.value = ''; setEditImagePreview(null); return; }
      setEditFormData(prev => ({ ...prev, image: file }));
      setEditImagePreview(URL.createObjectURL(file));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('kode', editFormData.kode);
    data.append('deskripsi', editFormData.deskripsi);
    data.append('valid_until', editFormData.valid_until);
    if (editFormData.image) data.append('image', editFormData.image);
    try {
      const response = await api.put(`/admin/promos/${editFormData.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        showToast('Promo berhasil diperbarui.');
        fetchPromos();
        handleCloseEditModal();
      }
    } catch (error) {
      console.error('Error updating promo:', error);
      showToast(`Error: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // ── Hapus ──
  const handleOpenConfirmModal = (promo) => {
    // Tutup detail dulu
    setIsDetailModalOpen(false);
    setDetailPromo(null);

    setItemToDelete(promo);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setItemToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const response = await api.delete(`/admin/promos/${itemToDelete.id}`);
      if (response.data.success) {
        showToast('Data promo berhasil dihapus.');
        fetchPromos();
        handleCloseConfirmModal();
      }
    } catch (error) {
      console.error('Error deleting promo:', error);
      showToast(`Error: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

  return (
    <div className="crud-page">
      {/* ── Header ── */}
      <div className="crud-page-header">
        <h1>Manajemen Promo</h1>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          <span>➕</span> Tambah Promo
        </button>
      </div>

      {/* ── Card Grid ── */}
      {isLoading ? (
        <div className="promo-loading">
          <div className="promo-loading-spinner" />
          <p>Memuat data promo...</p>
        </div>
      ) : promos.length === 0 ? (
        <div className="promo-empty">
          <div className="promo-empty-icon">🎫</div>
          <p>Belum ada data promo.</p>
        </div>
      ) : (
        <div className="rs-card-grid">
          {promos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} onSelect={handleOpenDetail} />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════
          MODAL DETAIL (klik card)
      ══════════════════════════════════ */}
      {isDetailModalOpen && detailPromo && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div
            className="modal-content promo-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header hijau */}
            <div className="promo-detail-header">
              <div className="promo-detail-header-img-wrap">
                <img
                  src={`${BASE_URL}/${detailPromo.image}`}
                  alt={detailPromo.title}
                  className="promo-detail-header-img"
                />
              </div>
              <div className="promo-detail-header-info">
                <p className="promo-detail-id">ID #{detailPromo.id}</p>
                <h2 className="promo-detail-title">{detailPromo.title}</h2>
                {new Date(detailPromo.valid_until) >= new Date() ? (
                  <span className="badge-active">Aktif</span>
                ) : (
                  <span className="badge-expired">Expired</span>
                )}
              </div>
              <button className="modal-close-btn promo-detail-close" onClick={handleCloseDetail}>×</button>
            </div>

            {/* Body */}
            <div className="modal-body promo-detail-body">
              <div className="promo-detail-row">
                <span className="promo-detail-label">Deskripsi</span>
                <span className="promo-detail-value">{detailPromo.description}</span>
              </div>
              <div className="promo-detail-row">
                <span className="promo-detail-label">Valid Sampai</span>
                <span className="promo-detail-value">{formatDate(detailPromo.valid_until)}</span>
              </div>
              <div className="promo-detail-row">
                <span className="promo-detail-label">Dibuat Pada</span>
                <span className="promo-detail-value">
                  {new Date(detailPromo.created_at).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Footer aksi */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseDetail}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn-edit"
                onClick={() => handleOpenEditModal(detailPromo)}
              >
                <span>✏️</span> Edit
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleOpenConfirmModal(detailPromo)}
              >
                <span>🗑️</span> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          MODAL TAMBAH PROMO
      ══════════════════════════════════ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Promo Baru</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="kode">Kode Promo (Title)</label>
                  <input
                    type="text" id="kode" name="kode"
                    value={formData.kode} onChange={handleFormChange} required
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="deskripsi">Deskripsi</label>
                  <input
                    type="text" id="deskripsi" name="deskripsi"
                    value={formData.deskripsi} onChange={handleFormChange} required
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="valid_until">Valid Sampai</label>
                  <input
                    type="date" id="valid_until" name="valid_until"
                    value={formData.valid_until} onChange={handleFormChange} required
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="image">
                    Gambar Promo{' '}
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>
                      (JPG/PNG/WEBP, maks. 500KB)
                    </span>
                  </label>
                  <input
                    type="file" id="image" name="image"
                    onChange={handleFormChange} required
                    accept=".jpg,.jpeg,.png,.webp"
                  />
                  {addImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview:</p>
                      <img
                        src={addImagePreview} alt="Preview"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════
          MODAL EDIT PROMO
      ══════════════════════════════════ */}
      {isEditModalOpen && selectedPromo && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Promo: {selectedPromo.title}</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="edit-kode">Kode Promo (Title)</label>
                  <input
                    type="text" id="edit-kode" name="kode"
                    value={editFormData.kode} onChange={handleEditFormChange} required
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-deskripsi">Deskripsi</label>
                  <input
                    type="text" id="edit-deskripsi" name="deskripsi"
                    value={editFormData.deskripsi} onChange={handleEditFormChange} required
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-valid_until">Valid Sampai</label>
                  <input
                    type="date" id="edit-valid_until" name="valid_until"
                    value={editFormData.valid_until} onChange={handleEditFormChange} required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Gambar Saat Ini</label>
                  <img
                    src={`${BASE_URL}/${editFormData.currentImage}`}
                    alt="Gambar saat ini"
                    style={{ width: '100px', height: 'auto', display: 'block', margin: '5px 0', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-image">
                    Ganti Gambar (Opsional){' '}
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span>
                  </label>
                  <input
                    type="file" id="edit-image" name="image"
                    onChange={handleEditFormChange}
                    accept=".jpg,.jpeg,.png,.webp"
                  />
                  {editImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview gambar baru:</p>
                      <img
                        src={editImagePreview} alt="Preview Baru"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }}
                      />
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

      {/* ══════════════════════════════════
          MODAL KONFIRMASI HAPUS
      ══════════════════════════════════ */}
      {isConfirmModalOpen && (
        <div className="modal-overlay confirmation-modal" onClick={handleCloseConfirmModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseConfirmModal}>×</button>
            <div className="modal-body">
              <div className="modal-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="modal-body-content">
                <h2>Konfirmasi Hapus</h2>
                <p>
                  Apakah Anda yakin ingin menghapus promo:{' '}
                  <strong>{itemToDelete?.title}</strong>?
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCloseConfirmModal}>Batal</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toastMessage && (
        <div className={`toast-notification ${toastType === 'error' ? 'toast-error' : ''}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default Promo;