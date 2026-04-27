// src/App.jsx
// ⭐ UPDATED: Tambah route /layanan-dokter

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from './layouts/AdminLayout';

import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ResetPassword from './pages/auth/ResetPassword';

import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Pesanan from './pages/Pesanan';
import Flacs from './pages/Flacs';
import Lasik from './pages/Lasik';

// ⭐ IMPORT HALAMAN LAYANAN DOKTER
import LayananDokter from './pages/LayananDokter';

import Rs from './pages/Rs';
import FasilitasRs from './pages/FasilitasRs';
import Asuransi from './pages/Asuransi';
import Obat from './pages/Obat';
import Maps from './pages/Maps';
import Coin from './pages/Coin';
import Cart from './pages/Cart';
import Promo from './pages/Promo';
import Testimoni from './pages/Testimoni';
import Videos from './pages/Videos';
import Event from './pages/Event';
import Journals from './pages/Journals';
import EditAdmin from './pages/EditAdmin';
import HapusAkun from './pages/HapusAkun';
import Logout from './pages/Logout';
import Dokter from './pages/Dokter';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));

  const handleLoginSuccess = () => setIsAuthenticated(true);
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return children;
  };

  const LoginRoute = ({ children }) => {
    if (isAuthenticated) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<LoginRoute><Login onLoginSuccess={handleLoginSuccess} /></LoginRoute>} />
        <Route path="/forgot-password" element={<LoginRoute><ForgotPassword /></LoginRoute>} />
        <Route path="/verify-otp" element={<LoginRoute><VerifyOtp /></LoginRoute>} />
        <Route path="/reset-password" element={<LoginRoute><ResetPassword /></LoginRoute>} />

        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="pesanan" element={<Pesanan />} />

          {/* Layanan Lasik & Flacs */}
          <Route path="layanan/flacs" element={<Flacs />} />
          <Route path="layanan/lasik" element={<Lasik />} />

          {/* ⭐ ROUTE LAYANAN DOKTER (jadwal & layanan per dokter) ⭐ */}
          <Route path="layanan-dokter" element={<LayananDokter />} />

          {/* Dokter */}
          <Route path="dokter" element={<Dokter />} />

          {/* Rumah Sakit & Asuransi */}
          <Route path="rs" element={<Rs />} />
          <Route path="fasilitas-rs" element={<FasilitasRs />} />
          <Route path="asuransi" element={<Asuransi />} />

          <Route path="obat" element={<Obat />} />
          <Route path="maps" element={<Maps />} />
          <Route path="coin" element={<Coin />} />
          <Route path="cart" element={<Cart />} />
          <Route path="promo" element={<Promo />} />
          <Route path="testimoni" element={<Testimoni />} />
          <Route path="videos" element={<Videos />} />
          <Route path="event" element={<Event />} />
          <Route path="journals" element={<Journals />} />
          <Route path="setting/edit-admin" element={<EditAdmin />} />
          <Route path="setting/hapus-akun" element={<HapusAkun />} />
          <Route path="logout" element={<Logout onLogout={handleLogout} />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;