import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jecLogo from '../../assets/logo/jec-logo.png';
import '../../css/style.css';
import Footer from '../../components/Footer'; // ⭐ Import Footer

function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [timer, setTimer] = useState(60);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/forgot-password');

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.nextSibling && element.value !== '') {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length < 6) {
      return setError('Harap masukkan 6 digit lengkap.');
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post('https://api-backend-jec.jakartaeyecenter.site/api/admin/auth/verify-otp', { email, otp: otpCode });

      if (res.data.success) {
        navigate('/reset-password', { state: { email } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'OTP Salah atau Kadaluwarsa');
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async () => {
    setTimer(60);
    setOtp(new Array(6).fill(''));
    setError('');
    inputRefs.current[0].focus();
    await axios.post('https://api-backend-jec.jakartaeyecenter.site/api/admin/auth/forgot-password', { email });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    // ⭐ Bungkus dengan wrapper flex-column agar footer nempel di bawah
    <div className="auth-page-wrapper">
      <div className="forgot-password-page">
        <div className="forgot-password-container">
          <img src={jecLogo} alt="JEC Logo" style={{ width: '100px', marginBottom: '1.5rem' }} />
          <h2>Verifikasi OTP</h2>
          <p className="forgot-subtitle">
            Kami telah mengirimkan kode verifikasi 6-digit ke email:<br />
            <strong>{email}</strong>
          </p>

          {error && <div className="login-error-message">{error}</div>}

          <form onSubmit={handleVerify}>
            <div className="otp-input-container">
              {otp.map((data, index) => (
                <input
                  key={index}
                  className="otp-box"
                  type="text"
                  name="otp"
                  maxLength="1"
                  value={data}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onFocus={(e) => e.target.select()}
                  required
                />
              ))}
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'MEMVERIFIKASI...' : 'VERIFIKASI AKUN'}
            </button>
          </form>

          <div className="timer-container">
            {timer > 0 ? (
              <span className="timer-text">
                Kirim ulang dalam{' '}
                <span className={`timer-countdown ${timer <= 10 ? 'timer-low' : ''}`}>
                  {formatTime(timer)}
                </span>
              </span>
            ) : (
              <button onClick={resendOtp} className="resend-btn">
                Minta Kode OTP Baru
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ Footer di sini */}
      <Footer />
    </div>
  );
}

export default VerifyOtp;