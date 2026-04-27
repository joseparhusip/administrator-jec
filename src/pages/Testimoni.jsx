import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../css/style.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/admin/testimonials`;
const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

// ── Testimoni Card (gaya rs-card) ────────────────────────────────
function TestimoniCard({ testi, onSelect }) {
  const imageUrl = testi.image ? `${BASE_URL}/${testi.image}` : null;
  const hasVideo = !!testi.video_id;

  return (
    <div className="rs-card testimoni-card" onClick={() => onSelect(testi)}>
      <div className="rs-card-image-wrap" style={{ position: 'relative' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={testi.name} className="rs-card-image" />
        ) : (
          <div className="rs-card-image-placeholder">👤</div>
        )}
        {/* Play icon overlay kalau ada video */}
        {hasVideo && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', paddingLeft: '3px'
            }}>▶</div>
          </div>
        )}
      </div>
      <div className="rs-card-body">
        <h3 className="rs-card-title">{testi.name}</h3>
        <p className="rs-card-location">{testi.title}</p>
        <span className={`rs-card-badge ${hasVideo ? 'rs' : 'klinik'}`}>
          {hasVideo ? '🎬 Ada Video' : '💬 Teks'}
        </span>
      </div>
    </div>
  );
}

function Testimoni() {
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal tambah
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({ name: '', title: '', video_id: '', image: null });
  const [addImagePreview, setAddImagePreview] = useState(null);

  // Modal edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '', name: '', title: '', video_id: '', image: null, currentImage: ''
  });
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Modal detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailTesti, setDetailTesti] = useState(null);

  // Modal hapus
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // ── Fetch ──
  const fetchTestimonials = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      if (response.data.success) setTestimonials(response.data.data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTestimonials(); }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 500 * 1024;
    if (!allowedTypes.includes(file.type)) { alert('Format gambar tidak didukung! Hanya JPG, PNG, dan WEBP.'); return false; }
    if (file.size > maxSize) { alert(`Ukuran gambar terlalu besar! Maksimal 500KB.`); return false; }
    return true;
  };

  // ── Tambah ──
  const handleAddFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      if (!file) return;
      if (!validateImageFile(file)) { e.target.value = ''; setAddImagePreview(null); return; }
      setAddFormData(prev => ({ ...prev, image: file }));
      setAddImagePreview(URL.createObjectURL(file));
    } else {
      setAddFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddFormData({ name: '', title: '', video_id: '', image: null });
    setAddImagePreview(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', addFormData.name);
    data.append('title', addFormData.title);
    data.append('video_id', addFormData.video_id);
    data.append('image', addFormData.image);
    try {
      const response = await axios.post(API_URL, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setToastMessage('Testimoni baru berhasil ditambahkan.');
        fetchTestimonials();
        handleCloseAddModal();
      }
    } catch (error) {
      console.error('Error creating testimoni:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Detail ──
  const handleOpenDetail = (testi) => {
    setDetailTesti(testi);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setDetailTesti(null);
  };

  // ── Edit ──
  const handleOpenEditModal = (testi) => {
    setIsDetailModalOpen(false);
    setDetailTesti(null);
    setEditFormData({
      id: testi.id, name: testi.name, title: testi.title,
      video_id: testi.video_id || '', image: null, currentImage: testi.image
    });
    setEditImagePreview(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => { setIsEditModalOpen(false); };

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
    data.append('name', editFormData.name);
    data.append('title', editFormData.title);
    data.append('video_id', editFormData.video_id);
    if (editFormData.image) data.append('image', editFormData.image);
    try {
      const response = await axios.put(`${API_URL}/${editFormData.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setToastMessage('Testimoni berhasil diperbarui.');
        fetchTestimonials();
        handleCloseEditModal();
      }
    } catch (error) {
      console.error('Error updating testimoni:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Hapus ──
  const handleOpenConfirmModal = (testi) => {
    setIsDetailModalOpen(false);
    setDetailTesti(null);
    setItemToDelete(testi);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setItemToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const response = await axios.delete(`${API_URL}/${itemToDelete.id}`);
      if (response.data.success) {
        setToastMessage('Data testimoni berhasil dihapus.');
        fetchTestimonials();
        handleCloseConfirmModal();
      }
    } catch (error) {
      console.error('Error deleting testimoni:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="crud-page">
      {/* ── Header ── */}
      <div className="crud-page-header">
        <h1>Manajemen Testimoni</h1>
        <button className="add-button" onClick={() => setIsAddModalOpen(true)}>
          <span>➕</span> Tambah Testimoni
        </button>
      </div>

      {/* ── Card Grid ── */}
      {isLoading ? (
        <div className="promo-loading">
          <div className="promo-loading-spinner" />
          <p>Memuat data testimoni...</p>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="promo-empty">
          <div className="promo-empty-icon">💬</div>
          <p>Belum ada data testimoni.</p>
        </div>
      ) : (
        <div className="rs-card-grid">
          {testimonials.map((testi) => (
            <TestimoniCard key={testi.id} testi={testi} onSelect={handleOpenDetail} />
          ))}
        </div>
      )}

      {/* ══ MODAL DETAIL ══ */}
      {isDetailModalOpen && detailTesti && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content promo-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="promo-detail-header">
              <div className="promo-detail-header-img-wrap">
                {detailTesti.image ? (
                  <img src={`${BASE_URL}/${detailTesti.image}`} alt={detailTesti.name} className="promo-detail-header-img" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
                )}
              </div>
              <div className="promo-detail-header-info">
                <p className="promo-detail-id">ID #{detailTesti.id}</p>
                <h2 className="promo-detail-title">{detailTesti.name}</h2>
                <span className="rs-card-badge rs" style={{ alignSelf: 'flex-start' }}>{detailTesti.title}</span>
              </div>
              <button className="modal-close-btn promo-detail-close" onClick={handleCloseDetail}>×</button>
            </div>

            <div className="modal-body promo-detail-body">
              <div className="promo-detail-row">
                <span className="promo-detail-label">Nama</span>
                <span className="promo-detail-value">{detailTesti.name}</span>
              </div>
              <div className="promo-detail-row">
                <span className="promo-detail-label">Title / Keterangan</span>
                <span className="promo-detail-value">{detailTesti.title}</span>
              </div>
              <div className="promo-detail-row">
                <span className="promo-detail-label">Video ID</span>
                {detailTesti.video_id ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${detailTesti.video_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="promo-detail-value"
                    style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                  >
                    {detailTesti.video_id} ↗
                  </a>
                ) : (
                  <span className="promo-detail-value" style={{ color: 'var(--gray-500)' }}>Tidak ada video</span>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCloseDetail}>Tutup</button>
              <button type="button" className="btn-edit" onClick={() => handleOpenEditModal(detailTesti)}>
                <span>✏️</span> Edit
              </button>
              <button type="button" className="btn-danger" onClick={() => handleOpenConfirmModal(detailTesti)}>
                <span>🗑️</span> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL TAMBAH ══ */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={handleCloseAddModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Testimoni Baru</h2>
              <button className="modal-close-btn" onClick={handleCloseAddModal}>×</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="add-name">Nama</label>
                  <input type="text" id="add-name" name="name" value={addFormData.name} onChange={handleAddFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="add-title">Title</label>
                  <input type="text" id="add-title" name="title" value={addFormData.title} onChange={handleAddFormChange} required placeholder="Contoh: Pasien BPJS JEC" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="add-video_id">Video ID (Opsional)</label>
                  <input type="text" id="add-video_id" name="video_id" value={addFormData.video_id} onChange={handleAddFormChange} placeholder="Contoh: 9DD_ruJM6Tk" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="add-image">Gambar Thumbnail <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                  <input type="file" id="add-image" name="image" onChange={handleAddFormChange} required accept=".jpg,.jpeg,.png,.webp" />
                  {addImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview:</p>
                      <img src={addImagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseAddModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL EDIT ══ */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Testimoni: {editFormData.name}</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="edit-name">Nama</label>
                  <input type="text" id="edit-name" name="name" value={editFormData.name} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-title">Title</label>
                  <input type="text" id="edit-title" name="title" value={editFormData.title} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-video_id">Video ID (Opsional)</label>
                  <input type="text" id="edit-video_id" name="video_id" value={editFormData.video_id} onChange={handleEditFormChange} />
                </div>
                <div className="modal-form-group">
                  <label>Gambar Saat Ini</label>
                  <img src={`${BASE_URL}/${editFormData.currentImage}`} alt="Saat ini" style={{ width: '100px', height: 'auto', display: 'block', margin: '5px 0', borderRadius: '8px', border: '1px solid #ddd' }} />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-image">Ganti Gambar (Opsional) <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                  <input type="file" id="edit-image" name="image" onChange={handleEditFormChange} accept=".jpg,.jpeg,.png,.webp" />
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

      {/* ══ MODAL HAPUS ══ */}
      {isConfirmModalOpen && (
        <div className="modal-overlay confirmation-modal" onClick={handleCloseConfirmModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseConfirmModal}>×</button>
            <div className="modal-body">
              <div className="modal-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="modal-body-content">
                <h2>Konfirmasi Hapus</h2>
                <p>Apakah Anda yakin ingin menghapus testimoni dari: <strong>{itemToDelete?.name}</strong>?</p>
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

export default Testimoni;