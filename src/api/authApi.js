import axiosInstance from './axiosInstance';

export const loginAdmin = (email, password) => {
  return axiosInstance.post('/admin/auth/login', { email, password });
};

export const forgotPassword = (email) => {
  return axiosInstance.post('/admin/auth/forgot-password', { email });
};

export const verifyOtp = (email, otp) => {
  return axiosInstance.post('/admin/auth/verify-otp', { email, otp });
};

export const resetPassword = (email, newPassword) => {
  return axiosInstance.post('/admin/auth/reset-password', { email, newPassword });
};