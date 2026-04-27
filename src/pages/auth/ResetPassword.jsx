import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jecLogo from '../../assets/logo/jec-logo.png';
import '../../css/style.css';
import Footer from '../../components/Footer';

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return setError('Password baru dan konfirmasi tidak cocok!');
    }

    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/api/admin/auth/reset-password', { email, newPassword });

      if (res.data.success) {
        alert('Password berhasil diperbarui! Silakan login kembali.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (

    <div className="auth-page-wrapper">
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <img src={jecLogo} alt="JEC Logo" style={{ width: '100px', marginBottom: '1.5rem' }} />
          <h2>Password Baru</h2>
          <p className="forgot-subtitle">Silakan buat password baru yang aman untuk akun Anda.</p>

          {error && <div className="login-error-message">{error}</div>}

          <form onSubmit={handleUpdatePassword}>
            <div className="input-wrapper">
              <input
                type="password"
                placeholder="Password Baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-wrapper">
              <input
                type="password"
                placeholder="Konfirmasi Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'MEMPERBARUI...' : 'UPDATE PASSWORD'}
            </button>
          </form>
        </div>
      </div>

      {/* ⭐ Footer di sini */}
      <Footer />
    </div>
  );
}

export default ResetPassword;