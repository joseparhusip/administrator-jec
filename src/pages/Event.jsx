import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import '../css/style.css';

// ✅ API URL dihandle oleh axiosInstance
const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

// ── Event Card (gaya rs-card) ────────────────────────────────────
function EventCard({ event, onSelect }) {
  const imageUrl = event.image ? `${BASE_URL}/${event.image}` : null;

  return (
    <div className="rs-card event-card" onClick={() => onSelect(event)}>
      <div className="rs-card-image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={event.title} className="rs-card-image" />
        ) : (
          <div className="rs-card-image-placeholder">🎉</div>
        )}
      </div>
      <div className="rs-card-body">
        <h3 className="rs-card-title">{event.title}</h3>
        <span className="rs-card-badge rs">Event</span>
      </div>
    </div>
  );
}

function Event() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal tambah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', image: null });
  const [addImagePreview, setAddImagePreview] = useState(null);

  // Modal edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    id: '', title: '', image: null, currentImage: ''
  });
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Modal detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  // Modal hapus
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // ── Fetch ──
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/events');
      if (response.data.success) setEvents(response.data.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // ── Validasi ──
  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 500 * 1024;
    if (!allowedTypes.includes(file.type)) {
      alert('Format gambar tidak didukung! Hanya JPG, PNG, dan WEBP.');
      return false;
    }
    if (file.size > maxSize) {
      alert(`Ukuran gambar terlalu besar! Maksimal 500KB. Ukuran Anda: ${(file.size / 1024).toFixed(0)}KB.`);
      return false;
    }
    return true;
  };

  // ── Tambah ──
  const handleFormChange = (e) => {
    if (e.target.type === 'file') {
      const file = e.target.files[0];
      if (!file) return;
      if (!validateImageFile(file)) { e.target.value = ''; return; }
      setFormData(prev => ({ ...prev, image: file }));
      setAddImagePreview(URL.createObjectURL(file));
    } else {
      setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ title: '', image: null });
    setAddImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('event_image', formData.image);
    try {
      const response = await api.post('/admin/events', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setToastMessage('Event baru berhasil ditambahkan.');
        fetchEvents();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Detail ──
  const handleOpenDetail = (event) => {
    setDetailEvent(event);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setDetailEvent(null);
  };

  // ── Edit ──
  const handleOpenEditModal = (event) => {
    setIsDetailModalOpen(false);
    setDetailEvent(null);
    setSelectedEvent(event);
    setEditFormData({ id: event.id, title: event.title, image: null, currentImage: event.image });
    setEditImagePreview(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEditFormChange = (e) => {
    if (e.target.type === 'file') {
      const file = e.target.files[0];
      if (!file) return;
      if (!validateImageFile(file)) { e.target.value = ''; return; }
      setEditFormData(prev => ({ ...prev, image: file }));
      setEditImagePreview(URL.createObjectURL(file));
    } else {
      setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', editFormData.title);
    if (editFormData.image) data.append('event_image', editFormData.image);
    try {
      const response = await api.put(`/admin/events/${editFormData.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setToastMessage('Event berhasil diperbarui.');
        fetchEvents();
        handleCloseEditModal();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Hapus ──
  const handleOpenConfirmModal = (event) => {
    setIsDetailModalOpen(false);
    setDetailEvent(null);
    setItemToDelete(event);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setItemToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const response = await api.delete(`/admin/events/${itemToDelete.id}`);
      if (response.data.success) {
        setToastMessage('Data event berhasil dihapus.');
        fetchEvents();
        handleCloseConfirmModal();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="crud-page">
      {/* ── Header ── */}
      <div className="crud-page-header">
        <h1>Manajemen Event</h1>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          <span>➕</span> Tambah Event
        </button>
      </div>

      {/* ── Card Grid ── */}
      {isLoading ? (
        <div className="promo-loading">
          <div className="promo-loading-spinner" />
          <p>Memuat data event...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="promo-empty">
          <div className="promo-empty-icon">🎉</div>
          <p>Belum ada data event.</p>
        </div>
      ) : (
        <div className="rs-card-grid">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onSelect={handleOpenDetail} />
          ))}
        </div>
      )}

      {/* ══ MODAL DETAIL ══ */}
      {isDetailModalOpen && detailEvent && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content promo-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header hijau */}
            <div className="promo-detail-header">
              <div className="promo-detail-header-img-wrap">
                {detailEvent.image ? (
                  <img src={`${BASE_URL}/${detailEvent.image}`} alt={detailEvent.title} className="promo-detail-header-img" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎉</div>
                )}
              </div>
              <div className="promo-detail-header-info">
                <p className="promo-detail-id">ID #{detailEvent.id}</p>
                <h2 className="promo-detail-title">{detailEvent.title}</h2>
                <span className="rs-card-badge rs" style={{ alignSelf: 'flex-start' }}>Event</span>
              </div>
              <button className="modal-close-btn promo-detail-close" onClick={handleCloseDetail}>×</button>
            </div>

            {/* Body */}
            <div className="modal-body promo-detail-body">
              <div className="promo-detail-row">
                <span className="promo-detail-label">Judul Event</span>
                <span className="promo-detail-value">{detailEvent.title}</span>
              </div>
              <div className="promo-detail-row">
                <span className="promo-detail-label">ID</span>
                <span className="promo-detail-value">#{detailEvent.id}</span>
              </div>
            </div>

            {/* Footer aksi */}
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCloseDetail}>Tutup</button>
              <button type="button" className="btn-edit" onClick={() => handleOpenEditModal(detailEvent)}>
                <span>✏️</span> Edit
              </button>
              <button type="button" className="btn-danger" onClick={() => handleOpenConfirmModal(detailEvent)}>
                <span>🗑️</span> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL TAMBAH ══ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Event Baru</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="title">Title</label>
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="event_image">Image <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                  <input type="file" id="event_image" name="event_image" onChange={handleFormChange} accept=".jpg,.jpeg,.png,.webp" required />
                  {addImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview:</p>
                      <img src={addImagePreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
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

      {/* ══ MODAL EDIT ══ */}
      {isEditModalOpen && selectedEvent && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Event: {selectedEvent.title}</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="edit-title">Title</label>
                  <input type="text" id="edit-title" name="title" value={editFormData.title} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Gambar Saat Ini</label>
                  <img src={`${BASE_URL}/${editFormData.currentImage}`} alt="Saat ini" style={{ width: '100px', height: 'auto', display: 'block', margin: '5px 0', borderRadius: '8px', border: '1px solid #ddd' }} />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-event_image">Ganti Image (Opsional) <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                  <input type="file" id="edit-event_image" name="event_image" onChange={handleEditFormChange} accept=".jpg,.jpeg,.png,.webp" />
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
                <p>Apakah Anda yakin ingin menghapus event: <strong>{itemToDelete?.title}</strong>?</p>
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

export default Event;