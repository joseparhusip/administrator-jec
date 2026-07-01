// path: path-to-your-frontend/src/pages/admin/Journals.jsx

import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import '../css/style.css';

// ✅ API URL dihandle oleh axiosInstance
const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

// ── Journal Selector Card ─────────────────────────────────────────────
function JournalCard({ journal, onSelect }) {
  const coverUrl = journal.cover_image ? `${BASE_URL}/${journal.cover_image}` : null;

  return (
    <div className="rs-card journal-card" onClick={() => onSelect(journal)}>
      <div className="rs-card-image-wrap">
        {coverUrl ? (
          <img src={coverUrl} alt={journal.title} className="rs-card-image" />
        ) : (
          <div className="rs-card-image-placeholder">📄</div>
        )}
      </div>
      <div className="rs-card-body">
        <h3 className="rs-card-title">{journal.title}</h3>
        <p className="rs-card-location" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontSize: '0.8rem',
          color: 'var(--gray-600)',
          lineHeight: '1.4',
          marginBottom: '0.5rem'
        }}>
          {journal.description}
        </p>
        <span className="rs-card-badge rs" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', border: '1px solid var(--primary-mid)' }}>
          📰 Jurnal
        </span>
      </div>
    </div>
  );
}

// ── PDF Viewer Modal (desktop only embed) ────────────────────────────
function PdfViewerModal({ pdfUrl, pdfName, onClose }) {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  // Mobile: langsung buka tab baru, tidak render modal
  useEffect(() => {
    if (isMobile) {
      window.open(pdfUrl, '_blank');
      onClose();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isMobile) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1100, alignItems: 'stretch', padding: '1.5rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '900px',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          margin: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          flexShrink: 0
        }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📄 {pdfName}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.35rem 0.85rem',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '7px',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              ↗ Buka Tab Baru
            </a>
            <button
              onClick={onClose}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              ×
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <iframe
          src={`${pdfUrl}#toolbar=1&navpanes=0`}
          title={pdfName}
          style={{ flex: 1, border: 'none', width: '100%', display: 'block' }}
        />
      </div>
    </div>
  );
}

// ── Journal Detail View (setelah card diklik) ─────────────────────────
function JournalDetailView({ journal, onBack, onEdit, onDelete }) {
  const coverUrl = journal.cover_image ? `${BASE_URL}/${journal.cover_image}` : null;
  const pdfUrl = journal.pdf_path ? `${BASE_URL}/${journal.pdf_path}` : null;
  const pdfName = journal.pdf_path ? journal.pdf_path.split('/').pop() : 'Lihat PDF';
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  return (
    <div className="crud-page">
      {/* Back Button */}
      <button className="frs-back-btn" onClick={onBack}>
        ← Kembali ke Daftar Jurnal
      </button>

      {/* Detail Header */}
      <div className="frs-gallery-header">
        {coverUrl ? (
          <img src={coverUrl} alt={journal.title} className="frs-gallery-header-img" />
        ) : (
          <div className="frs-gallery-header-placeholder">📄</div>
        )}
        <div className="frs-gallery-header-info">
          <h2>{journal.title}</h2>
          <p>ID #{journal.id} &nbsp;·&nbsp; 📰 Jurnal</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            className="btn-edit"
            onClick={() => onEdit(journal)}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            ✏️ Edit
          </button>
          <button
            className="btn-delete"
            onClick={() => onDelete(journal)}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
          >
            🗑️ Hapus
          </button>
        </div>
      </div>

      {/* Detail Body */}
      <div style={{
        background: 'var(--white)',
        borderRadius: '12px',
        border: '1.5px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        {/* Cover Image Full */}
        {coverUrl && (
          <div style={{ width: '100%', maxHeight: '340px', overflow: 'hidden', borderBottom: '1.5px solid var(--gray-200)' }}>
            <img
              src={coverUrl}
              alt={journal.title}
              style={{ width: '100%', height: '340px', objectFit: 'cover', display: 'block', cursor: 'zoom-in', transition: 'transform 0.3s ease' }}
              onClick={() => window.open(coverUrl, '_blank')}
              onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            />
          </div>
        )}

        {/* Info Rows */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Title */}
          <div className="promo-detail-row">
            <span className="promo-detail-label">Judul</span>
            <span className="promo-detail-value" style={{ fontWeight: 700, fontSize: '1rem' }}>{journal.title}</span>
          </div>

          {/* Description */}
          <div className="promo-detail-row">
            <span className="promo-detail-label">Deskripsi</span>
            <span className="promo-detail-value" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
              {journal.description}
            </span>
          </div>

          {/* PDF Tombol */}
          <div className="promo-detail-row">
            <span className="promo-detail-label">File PDF</span>
            {pdfUrl ? (
              <button
                onClick={() => setIsPdfOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 1rem',
                  background: 'var(--primary-light)',
                  border: '1.5px solid var(--primary-mid)',
                  borderRadius: '8px',
                  color: 'var(--primary-dark)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  width: 'fit-content',
                  transition: 'var(--transition)',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary-dark)'; e.currentTarget.style.borderColor = 'var(--primary-mid)'; }}
              >
                📄 {pdfName}
              </button>
            ) : (
              <span className="promo-detail-value" style={{ color: 'var(--gray-500)' }}>Tidak ada PDF</span>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {isPdfOpen && pdfUrl && (
        <PdfViewerModal
          pdfUrl={pdfUrl}
          pdfName={pdfName}
          onClose={() => setIsPdfOpen(false)}
        />
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
function Journals() {
  const [journals, setJournals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected journal for detail view
  const [selectedJournal, setSelectedJournal] = useState(null);

  // --- Modal Tambah ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', cover_image: null, pdf_path: null });
  const [addCoverPreview, setAddCoverPreview] = useState(null);

  // --- Modal Edit ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editFormData, setEditFormData] = useState({ id: '', title: '', description: '', cover_image: null, pdf_path: null });
  const [editCoverPreview, setEditCoverPreview] = useState(null);

  // --- Modal Hapus & Toast ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchJournals = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/journals');
      if (response.data.success) setJournals(response.data.data);
    } catch (error) {
      console.error('Error fetching journals:', error);
      showToast(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchJournals(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg) => setToastMessage(msg);

  const validateImageFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 500 * 1024;
    if (!allowedTypes.includes(file.type)) { alert('Format gambar tidak didukung! Hanya JPG, PNG, dan WEBP.'); return false; }
    if (file.size > maxSize) { alert(`Ukuran gambar terlalu besar! Maksimal 500KB. Ukuran Anda: ${(file.size / 1024).toFixed(0)}KB.`); return false; }
    return true;
  };

  // ── Tambah ──
  const handleFormChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (!file) return;
      if (name === 'cover_image') {
        if (!validateImageFile(file)) { e.target.value = ''; setAddCoverPreview(null); return; }
        setAddCoverPreview(URL.createObjectURL(file));
      }
      setFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ title: '', description: '', cover_image: null, pdf_path: null });
    setAddCoverPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cover_image || !formData.pdf_path) { showToast('Error: Cover Image dan PDF File wajib diisi.'); return; }
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('cover_image', formData.cover_image);
    data.append('pdf_path', formData.pdf_path);
    try {
      const res = await api.post('/admin/journals', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        showToast('Jurnal baru berhasil ditambahkan.');
        fetchJournals();
        handleCloseModal();
      }
    } catch (error) {
      showToast(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Edit ──
  const handleOpenEditModal = (journal) => {
    setEditTarget(journal);
    setEditFormData({ id: journal.id, title: journal.title, description: journal.description, cover_image: null, pdf_path: null });
    setEditCoverPreview(null);
    setIsEditModalOpen(true);
    // Jika sedang di detail view, tutup dulu
    // setSelectedJournal(null); // Opsional: tetap di detail view atau tidak
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditTarget(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (!file) return;
      if (name === 'cover_image') {
        if (!validateImageFile(file)) { e.target.value = ''; setEditCoverPreview(null); return; }
        setEditCoverPreview(URL.createObjectURL(file));
      }
      setEditFormData(prev => ({ ...prev, [name]: file }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', editFormData.title);
    data.append('description', editFormData.description);
    if (editFormData.cover_image) data.append('cover_image', editFormData.cover_image);
    if (editFormData.pdf_path) data.append('pdf_path', editFormData.pdf_path);
    try {
      const res = await api.put(`/admin/journals/${editFormData.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        showToast('Jurnal berhasil diperbarui.');
        fetchJournals();
        handleCloseEditModal();
        // Update selectedJournal jika sedang di detail view
        if (selectedJournal && selectedJournal.id === editFormData.id) {
          setSelectedJournal(prev => ({ ...prev, title: editFormData.title, description: editFormData.description }));
        }
      }
    } catch (error) {
      showToast(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Hapus ──
  const handleOpenConfirmModal = (journal) => {
    setItemToDelete(journal);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setItemToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const res = await api.delete(`/admin/journals/${itemToDelete.id}`);
      if (res.data.success) {
        showToast('Data jurnal berhasil dihapus.');
        fetchJournals();
        handleCloseConfirmModal();
        // Jika sedang di detail view journal yg dihapus → kembali ke list
        if (selectedJournal && selectedJournal.id === itemToDelete.id) {
          setSelectedJournal(null);
        }
      }
    } catch (error) {
      showToast(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ── Filter Search ──
  const filteredJournals = journals.filter(j =>
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Detail View ──
  if (selectedJournal) {
    return (
      <>
        <JournalDetailView
          journal={selectedJournal}
          onBack={() => setSelectedJournal(null)}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenConfirmModal}
        />

        {/* Modal Edit (bisa muncul dari detail view juga) */}
        {isEditModalOpen && editTarget && (
          <div className="modal-overlay" onClick={handleCloseEditModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Jurnal</h2>
                <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="modal-form-group">
                    <label>Title</label>
                    <input type="text" name="title" value={editFormData.title} onChange={handleEditFormChange} required />
                  </div>
                  <div className="modal-form-group">
                    <label>Description</label>
                    <textarea name="description" value={editFormData.description} onChange={handleEditFormChange} required rows={4} />
                  </div>
                  <div className="modal-form-group">
                    <label>Cover Saat Ini:</label>
                    <img src={`${BASE_URL}/${editTarget.cover_image}`} alt="Cover" style={{ width: '100px', height: 'auto', display: 'block', borderRadius: '6px', marginBottom: '8px' }} />
                    <label style={{ marginTop: '6px' }}>Ganti Cover Image (Opsional) <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                    <input type="file" name="cover_image" onChange={handleEditFormChange} accept=".jpg,.jpeg,.png,.webp" />
                    {editCoverPreview && (
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview cover baru:</p>
                        <img src={editCoverPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
                      </div>
                    )}
                  </div>
                  <div className="modal-form-group">
                    <label>PDF Saat Ini:</label>
                    <a href={`${BASE_URL}/${editTarget.pdf_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
                      {editTarget.pdf_path?.split('/').pop()}
                    </a>
                    <label style={{ marginTop: '10px' }}>Ganti PDF File (Opsional)</label>
                    <input type="file" name="pdf_path" onChange={handleEditFormChange} accept=".pdf" />
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

        {/* Modal Konfirmasi Hapus */}
        {isConfirmModalOpen && (
          <div className="modal-overlay confirmation-modal" onClick={handleCloseConfirmModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={handleCloseConfirmModal}>×</button>
              <div className="modal-body">
                <div className="modal-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="modal-body-content">
                  <h2>Konfirmasi Hapus</h2>
                  <p>Apakah Anda yakin ingin menghapus jurnal: <strong>{itemToDelete?.title}</strong>?</p>
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
      </>
    );
  }

  // ── List / Card Grid View ──
  return (
    <div className="crud-page">
      {/* Header */}
      <div className="crud-page-header">
        <h1>Manajemen Journals</h1>
        <div className="crud-header-controls">
          <button className="add-button" onClick={() => setIsModalOpen(true)}>
            <span>➕</span> Tulis Jurnal Baru
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="🔍 Cari judul atau deskripsi jurnal..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '420px',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            border: '1.5px solid var(--gray-300)',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            fontFamily: 'inherit'
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--gray-300)'}
        />
      </div>

      {/* Summary */}
      <div className="users-summary-bar">
        <span className="users-count-label">
          Menampilkan <strong>{filteredJournals.length}</strong> dari <strong>{journals.length}</strong> jurnal
        </span>
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat daftar jurnal...</p>
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-icon">📄</div>
          <p>Tidak ada jurnal ditemukan</p>
        </div>
      ) : (
        <div className="rs-card-grid">
          {filteredJournals.map(journal => (
            <JournalCard key={journal.id} journal={journal} onSelect={setSelectedJournal} />
          ))}
        </div>
      )}

      {/* Modal Tambah Jurnal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tulis Jurnal Baru</h2>
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="title">Title</label>
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="description">Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleFormChange} required rows={4} />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="cover_image">Cover Image <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                  <input type="file" id="cover_image" name="cover_image" onChange={handleFormChange} accept=".jpg,.jpeg,.png,.webp" required />
                  {addCoverPreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview:</p>
                      <img src={addCoverPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
                    </div>
                  )}
                </div>
                <div className="modal-form-group">
                  <label htmlFor="pdf_path">PDF File</label>
                  <input type="file" id="pdf_path" name="pdf_path" onChange={handleFormChange} accept=".pdf" required />
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

      {/* Modal Edit Jurnal */}
      {isEditModalOpen && editTarget && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Jurnal: {editTarget.title}</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Title</label>
                  <input type="text" name="title" value={editFormData.title} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label>Description</label>
                  <textarea name="description" value={editFormData.description} onChange={handleEditFormChange} required rows={4} />
                </div>
                <div className="modal-form-group">
                  <label>Cover Saat Ini:</label>
                  <img src={`${BASE_URL}/${editTarget.cover_image}`} alt="Cover" style={{ width: '100px', height: 'auto', display: 'block', borderRadius: '6px', marginBottom: '8px' }} />
                  <label style={{ marginTop: '6px' }}>Ganti Cover Image (Opsional) <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                  <input type="file" name="cover_image" onChange={handleEditFormChange} accept=".jpg,.jpeg,.png,.webp" />
                  {editCoverPreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview cover baru:</p>
                      <img src={editCoverPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
                    </div>
                  )}
                </div>
                <div className="modal-form-group">
                  <label>PDF Saat Ini:</label>
                  <a href={`${BASE_URL}/${editTarget.pdf_path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>
                    {editTarget.pdf_path?.split('/').pop()}
                  </a>
                  <label style={{ marginTop: '10px' }}>Ganti PDF File (Opsional)</label>
                  <input type="file" name="pdf_path" onChange={handleEditFormChange} accept=".pdf" />
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

      {/* Modal Konfirmasi Hapus */}
      {isConfirmModalOpen && (
        <div className="modal-overlay confirmation-modal" onClick={handleCloseConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseConfirmModal}>×</button>
            <div className="modal-body">
              <div className="modal-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="modal-body-content">
                <h2>Konfirmasi Hapus</h2>
                <p>Apakah Anda yakin ingin menghapus jurnal: <strong>{itemToDelete?.title}</strong>?</p>
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

export default Journals;