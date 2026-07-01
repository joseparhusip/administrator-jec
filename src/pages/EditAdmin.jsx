// path: src/pages/admin/EditAdmin.jsx

import React, { useState, useEffect } from 'react';
import '../css/style.css'; 
import api from '../api/axiosInstance';  // ✅ Fix: pakai axiosInstance

// ✅ Fix: API_URL relatif (axiosInstance sudah handle baseURL + /api prefix)
// ✅ Fix: token tidak diambil di module level (stale), tapi dihandle interceptor

function EditAdmin() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await api.get('/admin/auth/profile');
        if (response.data.success) {
          const { name, email } = response.data.data;
          setFormData(prevData => ({ ...prevData, name, email }));
        }
      } catch (error) {
        console.error('Gagal mengambil profil admin:', error);
        setToastMessage(error.response?.data?.message || 'Gagal memuat profil.');
        setToastType('error');
      }
    };
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage('');
        setToastType('success');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToastMessage('');
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setToastMessage("Konfirmasi password baru tidak cocok.");
      setToastType('error');
      return;
    }
    
    if (formData.newPassword && !formData.currentPassword) {
       setToastMessage("Password saat ini harus diisi untuk mengganti password.");
       setToastType('error');
       return;
    }

    const dataToUpdate = {
      name: formData.name,
      email: formData.email,
      currentPassword: formData.currentPassword || undefined,
      newPassword: formData.newPassword || undefined
    };

    try {
      const response = await api.put('/admin/auth/profile', dataToUpdate);
      if (response.data.success) {
        setToastMessage('Profil berhasil diperbarui.');
        setToastType('success');
        // ✅ Fix: updateProfile di backend tidak return data baru, jadi pakai formData saja
        setFormData(prevData => ({
          ...prevData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
        setToastMessage(error.response?.data?.message || 'Gagal menyimpan profil.');
        setToastType('error');
    }
  };

  return (
    <div className="crud-page">
      <div className="crud-page-header">
        <div>
          <h1 style={{ display: 'block' }}>Pengaturan Profil</h1>
          <p style={{ color: 'var(--gray-600)', marginTop: '0.5rem' }}>Kelola informasi data diri dan keamanan akun Anda di sini.</p>
        </div>
      </div>
      
      <div className="settings-wrapper" style={{ marginLeft: 'auto', marginRight: 'auto', maxWidth: '800px' }}>
        
        <form onSubmit={handleSubmit} className="settings-form" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section 1: Data Pribadi */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Informasi Dasar</h3>
              <p>Perbarui nama dan email untuk akun Anda.</p>
            </div>
            <div className="settings-card-body">
              <div className="form-grid">
                <div className="modal-form-group">
                  <label htmlFor="name">Nama Lengkap</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required placeholder="Masukkan nama Anda" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="email">Alamat Email</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} required placeholder="email@contoh.com" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Keamanan */}
          <div className="settings-card">
            <div className="settings-card-header">
              <h3>Keamanan Akun</h3>
              <p>Biarkan kosong jika Anda tidak ingin mengganti password.</p>
            </div>
            <div className="settings-card-body">
              <div className="modal-form-group full-width">
                <label htmlFor="currentPassword">Password Saat Ini</label>
                <input type="password" id="currentPassword" name="currentPassword" value={formData.currentPassword} onChange={handleFormChange} placeholder="••••••••" />
              </div>
              <div className="form-grid">
                <div className="modal-form-group">
                  <label htmlFor="newPassword">Password Baru</label>
                  <input type="password" id="newPassword" name="newPassword" value={formData.newPassword} onChange={handleFormChange} placeholder="Minimal 8 karakter" />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="confirmPassword">Konfirmasi Password</label>
                  <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleFormChange} placeholder="Ketik ulang password baru" />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-footer" style={{ justifyContent: 'flex-start' }}>
            <button type="submit" className="btn-primary btn-large">
              Simpan Perubahan
            </button>
          </div>

        </form>
      </div>

      {toastMessage && (
        <div className={`toast-notification ${toastType === 'error' ? 'error' : ''}`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default EditAdmin;