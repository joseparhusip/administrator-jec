import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/style.css';

function Logout({ onLogout }) {
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleOpenConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    // Kembali ke halaman sebelumnya jika user membatalkan
    navigate(-1);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('adminToken');

    if (onLogout) {
      onLogout();
    }

    navigate('/login', { replace: true });
  };

  return (
    <div className="crud-page">
      <div className="crud-page-header">
        <div>
          <h1>Logout</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem' }}>
            Akhiri sesi Anda dan keluar dari sistem.
          </p>
        </div>
      </div>

      <div className="danger-zone-container" style={{ maxWidth: '100%' }}>
        <div className="danger-zone-content">
          <div className="danger-icon-wrapper">
            {/* Icon Logout */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div className="danger-text">
            <h2>Keluar dari Akun Ini?</h2>
            <p>
              Anda akan <strong>mengakhiri sesi aktif</strong> saat ini. Semua aktivitas yang belum disimpan
              mungkin akan hilang. Anda perlu login kembali untuk mengakses panel admin.
            </p>
          </div>
        </div>

        <div className="danger-action">
          <button className="btn-danger outline-danger" onClick={handleOpenConfirmModal}>
            Logout Sekarang
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI LOGOUT */}
      {isConfirmModalOpen && (
        <div className="modal-overlay" onClick={handleCloseConfirmModal}>
          <div className="modal-content modal-danger" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '450px' }}>
            <div className="modal-body text-center">
              <div className="modal-icon warning-pulse">
                {/* Icon Logout di modal */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#dc2626">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', color: '#dc2626', marginBottom: '0.5rem' }}>
                Konfirmasi Logout
              </h2>
              <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Apakah Anda yakin ingin keluar dari sistem? Sesi Anda akan diakhiri dan Anda
                akan diarahkan ke halaman login.
              </p>

              <div className="modal-action-buttons">
                <button
                  type="button"
                  className="btn-secondary btn-block"
                  onClick={handleCloseConfirmModal}
                >
                  Batalkan
                </button>
                <button
                  type="button"
                  className="btn-danger btn-block"
                  onClick={handleLogoutConfirm}
                >
                  Ya, Logout!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Logout;