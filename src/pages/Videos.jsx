import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import '../css/style.css';

// ✅ API URL dihandle oleh axiosInstance

// ── Video Card (gaya rs-card) ────────────────────────────────────
function VideoCard({ video, onSelect }) {
  // Thumbnail YouTube otomatis dari video_id
  const thumbnailUrl = video.thumbnail_url
    || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`;

  return (
    <div className="rs-card" onClick={() => onSelect(video)}>
      <div className="rs-card-image-wrap" style={{ position: 'relative' }}>
        <img src={thumbnailUrl} alt={video.title} className="rs-card-image" />
        {/* Play button overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', paddingLeft: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
          }}>▶</div>
        </div>
      </div>
      <div className="rs-card-body">
        <h3 className="rs-card-title">{video.title}</h3>
        <p className="rs-card-location" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {video.description}
        </p>
        <span className="rs-card-badge rs">🎬 YouTube</span>
      </div>
    </div>
  );
}

function Videos() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal tambah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', video_id: '' });

  // Modal edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', title: '', description: '', video_id: '' });

  // Modal detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailVideo, setDetailVideo] = useState(null);

  // Modal hapus
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // ── Fetch ──
  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/videos');
      if (response.data.success) setVideos(response.data.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // ── Tambah ──
  const handleFormChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ title: '', description: '', video_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/videos', formData);
      if (response.data.success) {
        setToastMessage('Video baru berhasil ditambahkan.');
        fetchVideos();
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error creating video:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Detail ──
  const handleOpenDetail = (video) => {
    setDetailVideo(video);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setDetailVideo(null);
  };

  // ── Edit ──
  const handleOpenEditModal = (video) => {
    setIsDetailModalOpen(false);
    setDetailVideo(null);
    setEditFormData({ id: video.id, title: video.title, description: video.description, video_id: video.video_id });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => { setIsEditModalOpen(false); };

  const handleEditFormChange = (e) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/admin/videos/${editFormData.id}`, editFormData);
      if (response.data.success) {
        setToastMessage('Video berhasil diperbarui.');
        fetchVideos();
        handleCloseEditModal();
      }
    } catch (error) {
      console.error('Error updating video:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Hapus ──
  const handleOpenConfirmModal = (video) => {
    setIsDetailModalOpen(false);
    setDetailVideo(null);
    setItemToDelete(video);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setItemToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const response = await api.delete(`/admin/videos/${itemToDelete.id}`);
      if (response.data.success) {
        setToastMessage('Data video berhasil dihapus.');
        fetchVideos();
        handleCloseConfirmModal();
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="crud-page">
      {/* ── Header ── */}
      <div className="crud-page-header">
        <h1>Manajemen Videos</h1>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>
          <span>➕</span> Tambah Video
        </button>
      </div>

      {/* ── Card Grid ── */}
      {isLoading ? (
        <div className="promo-loading">
          <div className="promo-loading-spinner" />
          <p>Memuat data video...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="promo-empty">
          <div className="promo-empty-icon">🎬</div>
          <p>Belum ada data video.</p>
        </div>
      ) : (
        <div className="rs-card-grid">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onSelect={handleOpenDetail} />
          ))}
        </div>
      )}

      {/* ══ MODAL DETAIL ══ */}
      {isDetailModalOpen && detailVideo && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content promo-detail-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header hijau */}
            <div className="promo-detail-header">
              <div className="promo-detail-header-img-wrap">
                <img
                  src={detailVideo.thumbnail_url || `https://img.youtube.com/vi/${detailVideo.video_id}/mqdefault.jpg`}
                  alt={detailVideo.title}
                  className="promo-detail-header-img"
                />
              </div>
              <div className="promo-detail-header-info">
                <p className="promo-detail-id">ID #{detailVideo.id}</p>
                <h2 className="promo-detail-title">{detailVideo.title}</h2>
                <span className="rs-card-badge rs" style={{ alignSelf: 'flex-start' }}>🎬 YouTube</span>
              </div>
              <button className="modal-close-btn promo-detail-close" onClick={handleCloseDetail}>×</button>
            </div>

            {/* Embed preview YouTube */}
            <div style={{ padding: '1rem 1.5rem 0' }}>
              <iframe
                width="100%"
                style={{ borderRadius: '10px', border: 'none', aspectRatio: '16/9' }}
                src={`https://www.youtube.com/embed/${detailVideo.video_id}`}
                title={detailVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="modal-body promo-detail-body">
              <div className="promo-detail-row">
                <span className="promo-detail-label">Judul</span>
                <span className="promo-detail-value">{detailVideo.title}</span>
              </div>
              <div className="promo-detail-row">
                <span className="promo-detail-label">Deskripsi</span>
                <span className="promo-detail-value" style={{ whiteSpace: 'pre-wrap' }}>{detailVideo.description}</span>
              </div>
              <div className="promo-detail-row">
                <span className="promo-detail-label">Video ID</span>
                <a
                  href={`https://www.youtube.com/watch?v=${detailVideo.video_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="promo-detail-value"
                  style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                >
                  {detailVideo.video_id} ↗
                </a>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCloseDetail}>Tutup</button>
              <button type="button" className="btn-edit" onClick={() => handleOpenEditModal(detailVideo)}>
                <span>✏️</span> Edit
              </button>
              <button type="button" className="btn-danger" onClick={() => handleOpenConfirmModal(detailVideo)}>
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
              <h2>Tambah Video Baru</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="title">Title (Judul)</label>
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="description">Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="video_id">Video ID</label>
                  <input type="text" id="video_id" name="video_id" value={formData.video_id} onChange={handleFormChange} required placeholder="Contoh: REJnA-zUBY0" />
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
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Video: {editFormData.title}</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="edit-title">Title (Judul)</label>
                  <input type="text" id="edit-title" name="title" value={editFormData.title} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-description">Description</label>
                  <textarea id="edit-description" name="description" value={editFormData.description} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-video_id">Video ID</label>
                  <input type="text" id="edit-video_id" name="video_id" value={editFormData.video_id} onChange={handleEditFormChange} required />
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
                <p>Apakah Anda yakin ingin menghapus video: <strong>{itemToDelete?.title}</strong>?</p>
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

export default Videos;