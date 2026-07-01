// path: src/pages/admin/HapusAkun.jsx

import React, { useState } from 'react';
import '../css/style.css'; 
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';  // ✅ Fix: tambah API call yang sebelumnya belum ada

function HapusAkun() {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const navigate = useNavigate();

  const handleOpenConfirmModal = () => setIsConfirmModalOpen(true);
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  // ✅ Fix: implementasi API delete yang sebelumnya hanya console.log
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const response = await api.delete('/admin/auth/profile');
      if (response.data.success) {
        localStorage.removeItem('adminToken');
        handleCloseConfirmModal();
        // Redirect ke login setelah hapus
        navigate('/login');
      }
    } catch (error) {
      setToastMessage(error.response?.data?.message || 'Gagal menghapus akun. Coba lagi.');
      setToastType('error');
      handleCloseConfirmModal();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-page-header">
        <div>
          <h1>Hapus Akun</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem' }}>Pengaturan zona berbahaya (Danger Zone).</p>
        </div>
      </div>
      
      <div className="danger-zone-container">
        <div className="danger-zone-content">
          <div className="danger-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="danger-text">
            <h2>Hapus Akun Admin Ini?</h2>
            <p>
              Tindakan ini bersifat <strong>permanen</strong> dan <strong>tidak dapat dibatalkan</strong>. 
              Seluruh data, log aktivitas, dan akses yang terkait dengan akun admin ini akan dihapus sepenuhnya dari sistem aplikasi.
            </p>
          </div>
        </div>
        
        <div className="danger-action">
          <button className="btn-danger outline-danger" onClick={handleOpenConfirmModal}>
            Hapus Akun Saya
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI */}
      {isConfirmModalOpen && (
        <div className="modal-overlay" onClick={handleCloseConfirmModal}>
          <div className="modal-content modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body text-center">
              <div className="modal-icon warning-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', color: '#dc2626', marginBottom: '0.5rem' }}>Anda Yakin?</h2>
              <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Apakah Anda benar-benar yakin ingin menghapus akun ini? Tindakan ini tidak bisa dibatalkan setelah Anda menekan tombol hapus.
              </p>
              
              <div className="modal-action-buttons">
                <button type="button" className="btn-secondary btn-block" onClick={handleCloseConfirmModal} disabled={isDeleting}>
                  Batalkan
                </button>
                <button type="button" className="btn-danger btn-block" onClick={handleDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? 'Menghapus...' : 'Ya, Yakin Dihapus!'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`toast-notification ${toastType === 'error' ? 'error' : ''}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default HapusAkun;