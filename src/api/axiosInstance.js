// path: src/api/axiosInstance.js
// ✅ FILE BARU — Import ini di semua halaman admin sebagai pengganti axios biasa
// Solusi terpusat untuk 3 masalah sekaligus:
//   1. Base URL selalu benar (fallback ke localhost:3000)
//   2. Prefix /api selalu ada
//   3. Authorization header selalu dikirim otomatis

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// ✅ Interceptor: tambahkan token Bearer otomatis di setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor: tangani 401 (token expired) → redirect ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;