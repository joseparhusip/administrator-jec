import axios from 'axios';

// Konfigurasi URL dari Environment atau Localhost
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
export const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || 'http://localhost:3000';

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor otomatis untuk Token Admin
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// --- EXPORT SEMUA FUNGSI API ---
export const loginAdmin = (email, password) => axiosInstance.post('/admin/auth/login', { email, password });
export const forgotPassword = (email) => axiosInstance.post('/admin/auth/forgot-password', { email });
export const verifyOtp = (email, otp) => axiosInstance.post('/admin/auth/verify-otp', { email, otp });
export const resetPassword = (email, newPassword) => axiosInstance.post('/admin/auth/reset-password', { email, newPassword });
export const getAdminProfile = () => axiosInstance.get('/admin/auth/profile');
export const updateAdminProfile = (data) => axiosInstance.put('/admin/auth/profile', data);

export const getDashboardStats = () => axiosInstance.get('/admin/beranda/stats');
export const getLoginActivity = () => axiosInstance.get('/admin/beranda/login-activity');

export const getAllUserPoints = () => axiosInstance.get('/admin/coin');
export const updateUserPoints = (userId, points) => axiosInstance.put(`/admin/coin/${userId}`, { points });
export const deleteUserPoints = (userId) => axiosInstance.delete(`/admin/coin/${userId}`);

export const getFasilitasDropdown = () => axiosInstance.get('/admin/fasilitas');
export const getFasilitasGallery = (id) => axiosInstance.get(`/admin/fasilitas-rs?fasilitas_id=${id}`);
export const uploadFasilitasImage = (data) => axiosInstance.post('/admin/fasilitas-rs', data);
export const deleteFasilitasImage = (id) => axiosInstance.delete(`/admin/fasilitas-rs/${id}`);

export const getAsuransiByFasilitas = (id) => axiosInstance.get(`/admin/asuransi?fasilitas_id=${id}`);
export const createAsuransi = (data) => axiosInstance.post('/admin/asuransi', data);
export const updateAsuransi = (id, data) => axiosInstance.put(`/admin/asuransi/${id}`, data);
export const deleteAsuransi = (id) => axiosInstance.delete(`/admin/asuransi/${id}`);

export const getEvents = () => axiosInstance.get('/admin/events');
export const createEvent = (data) => axiosInstance.post('/admin/events', data);
export const updateEvent = (id, data) => axiosInstance.put(`/admin/events/${id}`, data);
export const deleteEvent = (id) => axiosInstance.delete(`/admin/events/${id}`);

export const getJournals = () => axiosInstance.get('/admin/journals');
export const createJournal = (data) => axiosInstance.post('/admin/journals', data);
export const updateJournal = (id, data) => axiosInstance.put(`/admin/journals/${id}`, data);
export const deleteJournal = (id) => axiosInstance.delete(`/admin/journals/${id}`);

export const getCartData = () => axiosInstance.get('/admin/cart');
export const updateCartItem = (id, data) => axiosInstance.put(`/admin/cart/${id}`, data);
export const deleteCartItem = (id) => axiosInstance.delete(`/admin/cart/${id}`);

export default axiosInstance;