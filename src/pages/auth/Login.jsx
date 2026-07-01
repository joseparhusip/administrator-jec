import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import jecLogo from '../../assets/logo/jec-logo.png';
import '../../css/style.css';
import Footer from '../../components/Footer';

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginURL = `${import.meta.env.VITE_API_BASE_URL || 'https://api-backend-jec.jakartaeyecenter.site'}/api/admin/auth/login`;
      const response = await axios.post(loginURL, { email, password });

      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.token);
        onLoginSuccess();
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal. Terjadi kesalahan jaringan.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="login-page">
        <div className="login-graphic-side">
          <img src={jecLogo} alt="JEC Logo" className="login-main-logo" />
          <h2>JEC Eye Hospital</h2>
          <p>Administrator Dashboard</p>
        </div>

        <div className="login-form-side">
          <div className="login-form-container">
            <h2>Login as an Admin User</h2>
            <p className="login-subtitle">Silakan masukkan kredensial Anda untuk masuk.</p>

            {error && <div className="login-error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="input-wrapper">
                <span className="input-icon"><UserIcon /></span>
                <input
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-wrapper">
                <span className="input-icon"><LockIcon /></span>
                <input
                  type="password"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-button" disabled={isLoading}>
                {isLoading ? 'LOADING...' : 'LOGIN'}
              </button>
            </form>

            <div className="login-links">
              <Link to="/forgot-password">Forget your password?</Link>
            </div>

            <p className="login-footer-text">Terms of use. Privacy policy</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Login;