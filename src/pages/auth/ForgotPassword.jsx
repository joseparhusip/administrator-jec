import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jecLogo from '../../assets/logo/jec-logo.png';
import '../../css/style.css';
import Footer from '../../components/Footer'; 

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/admin/auth/forgot-password', { email });

      if (response.data.success) {
        navigate('/verify-otp', { state: { email } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    
    <div className="auth-page-wrapper">
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <img src={jecLogo} alt="JEC Logo" style={{ width: '120px', marginBottom: '1.5rem' }} />
          <h2>Reset Password</h2>
          <p className="forgot-subtitle">
            Masukkan email administrator Anda. Kami akan mengirimkan kode OTP untuk verifikasi.
          </p>

          {error && <div className="login-error-message">{error}</div>}

          <form onSubmit={handleSendOtp}>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'MENGIRIM...' : 'KIRIM KODE OTP'}
            </button>
          </form>

          <Link to="/login" className="back-to-login">
            ← Kembali ke Halaman Login
          </Link>
        </div>
      </div>

      {/* ⭐ Footer di sini */}
      <Footer />
    </div>
  );
}

export default ForgotPassword;