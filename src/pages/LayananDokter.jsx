// path: src/pages/LayananDokter.jsx
// Halaman Admin: Manajemen Layanan & Jadwal Dokter
// ✅ FULL REDESIGN: Card mirip Dokter.jsx, hari sejajar, detail layanan premium + Pagination

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import '../css/style.css';

// serverBase = base server tanpa /api (untuk gambar, diturunkan dari axiosInstance.defaults.baseURL)
// ✅ Fix: API_BASE (variabel global yang sudah dihapus) diganti dengan api.defaults.baseURL

// ============================================================
// ICON COMPONENTS
// ============================================================
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconTag = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);
const IconUser = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconHospital = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ============================================================
// KONSTANTA
// ============================================================
const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const HARI_COLOR = {
  Senin:   { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7' },
  Selasa:  { bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
  Rabu:    { bg: '#FFF3E0', color: '#E65100', border: '#FFCC80' },
  Kamis:   { bg: '#F3E5F5', color: '#6A1B9A', border: '#CE93D8' },
  Jumat:   { bg: '#FCE4EC', color: '#880E4F', border: '#F48FB1' },
  Sabtu:   { bg: '#E0F7FA', color: '#006064', border: '#80DEEA' },
  Minggu:  { bg: '#FFF8E1', color: '#F57F17', border: '#FFE082' },
};

// ============================================================
// INJECT CSS (jadwal + layanan dokter styles + Pagination)
// ============================================================
if (!document.getElementById('layanan-dokter-styles')) {
  const style = document.createElement('style');
  style.id = 'layanan-dokter-styles';
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideInUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* --- CSS Pagination --- */
    .pagination-container {
      display: flex;
      justify-content: flex-end; /* Posisi di pojok kanan */
      align-items: center;
      gap: 6px;
      margin-top: 24px;
      padding-bottom: 24px;
    }
    
    .pagination-btn {
      padding: 6px 14px;
      background: #ffffff;
      border: 1.5px solid #E2E8F0;
      color: #64748B;
      font-weight: 600;
      font-size: 0.85rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .pagination-btn:hover:not(:disabled) {
      background: #F8FAFC;
      border-color: #CBD5E1;
      color: #334155;
    }
    
    .pagination-btn.active {
      background: #2E7D32;
      border-color: #2E7D32;
      color: #ffffff;
    }
    
    .pagination-btn:disabled {
      background: #F1F5F9;
      color: #94A3B8;
      cursor: not-allowed;
      border-color: #E2E8F0;
    }

    /* ── GRID KARTU LAYANAN DOKTER (mirip dokter-card-grid) ── */
    .ld-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 22px;
      margin-top: 6px;
      align-items: stretch;
    }

    /* ── CARD (identik Dokter.jsx) ── */
    .ld-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(60, 80, 120, 0.08);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.18s, box-shadow 0.18s;
      display: flex;
      flex-direction: column;
      border: 1.5px solid #f0f4fa;
      height: 100%;
    }
    .ld-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(46, 125, 50, 0.15);
      border-color: #A5D6A7;
    }
    .ld-card-photo-wrap {
      width: 100%;
      aspect-ratio: 3 / 4;
      overflow: hidden;
      background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }
    .ld-card-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top center;
      display: block;
      transition: transform 0.3s;
    }
    .ld-card:hover .ld-card-photo { transform: scale(1.04); }
    .ld-card-photo-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #81C784;
      opacity: 0.8;
      margin-top: auto;
      margin-bottom: auto;
    }
    .ld-card-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%);
      display: flex;
      gap: 8px;
      padding: 10px 10px 10px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .ld-card:hover .ld-card-overlay { opacity: 1; }
    .ld-overlay-badge {
      background: rgba(255,255,255,0.92);
      color: #2E7D32;
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .ld-card-body {
      padding: 14px 16px 10px;
      flex: 1;
      min-height: 100px;
    }
    .ld-card-name {
      font-size: 0.92rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 6px;
      line-height: 1.35;
      min-height: 2.5em;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .ld-card-spesialis {
      display: inline-block;
      font-size: 0.76rem;
      background: #E8F5E9;
      color: #2E7D32;
      border-radius: 20px;
      padding: 3px 10px;
      font-weight: 600;
    }
    .ld-card-meta {
      display: flex;
      gap: 12px;
      margin-top: 10px;
    }
    .ld-card-meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #6c757d;
      font-weight: 500;
    }
    .ld-card-actions {
      display: flex;
      gap: 0;
      border-top: 1px solid #f0f4fa;
    }
    .ld-card-action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 10px 0;
      font-size: 0.8rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      background: transparent;
      color: #2E7D32;
    }
    .ld-card-action-btn:hover {
      background: #E8F5E9;
      color: #1B5E20;
    }
    .ld-card-action-btn.manage {
      border-right: 1px solid #f0f4fa;
    }

    /* ── JADWAL ROW: HARI SEJAJAR ── */
    .ld-jadwal-row {
      display: grid;
      grid-template-columns: 88px 1fr auto;
      align-items: center;
      gap: 0;
      background: #fff;
      border: 1.5px solid #e9ecef;
      border-radius: 12px;
      overflow: hidden;
      transition: box-shadow 0.15s;
    }
    .ld-jadwal-row:hover {
      box-shadow: 0 2px 12px rgba(46,125,50,0.10);
      border-color: #A5D6A7;
    }
    .ld-jadwal-hari {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px 10px;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      border-right: 1.5px solid rgba(0,0,0,0.06);
      min-height: 64px;
      letter-spacing: 0.01em;
    }
    .ld-jadwal-info {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 14px 18px;
      flex-wrap: wrap;
    }
    .ld-jadwal-jam {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 700;
      color: #212529;
      white-space: nowrap;
    }
    .ld-jadwal-lokasi {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #6c757d;
      font-weight: 500;
    }
    .ld-jadwal-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 14px 14px;
      border-left: 1.5px solid #f0f4fa;
      background: #fafafa;
    }

    /* ── LAYANAN BADGE CARD (detail) ── */
    .ld-layanan-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff;
      border: 1.5px solid #e9ecef;
      border-radius: 12px;
      padding: 10px 14px;
      transition: all 0.15s;
    }
    .ld-layanan-item:hover {
      border-color: #A5D6A7;
      background: #F1F8E9;
    }
    .ld-layanan-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #E8F5E9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2E7D32;
      flex-shrink: 0;
      overflow: hidden;
    }
    .ld-layanan-icon-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .ld-layanan-label {
      font-size: 13px;
      font-weight: 600;
      color: #212529;
      line-height: 1.3;
    }

    /* ── DETAIL HEADER CARD ── */
    .ld-detail-profile-card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 30px rgba(46,125,50,0.08);
      overflow: hidden;
      display: flex;
      gap: 0;
      border: 1.5px solid #E8F5E9;
    }
    .ld-detail-photo-wrap {
      width: 280px;
      flex-shrink: 0;
      background: linear-gradient(160deg, #E8F5E9 0%, #C8E6C9 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-height: 320px;
    }
    .ld-detail-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
    }
    .ld-detail-photo-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #81C784;
      opacity: 0.6;
      transform: scale(2.5);
    }
    .ld-detail-info {
      flex: 1;
      padding: 32px 36px;
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .ld-detail-badge {
      display: inline-block;
      background: #E8F5E9;
      color: #2E7D32;
      border-radius: 20px;
      padding: 5px 16px;
      font-size: 0.82rem;
      font-weight: 700;
      margin-bottom: 12px;
      width: fit-content;
    }
    .ld-detail-name {
      font-size: 1.65rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px;
      line-height: 1.2;
    }
    .ld-detail-stats {
      display: flex;
      gap: 20px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #f0f4fa;
    }
    .ld-stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #f8f9fa;
      border-radius: 12px;
      padding: 14px 22px;
      min-width: 90px;
      gap: 4px;
    }
    .ld-stat-number {
      font-size: 1.6rem;
      font-weight: 800;
      color: #2E7D32;
      line-height: 1;
    }
    .ld-stat-label {
      font-size: 11px;
      color: #6c757d;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: center;
    }

    /* ── SECTION CARD ── */
    .ld-section-card {
      background: #fff;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid #f1f3f5;
    }
    .ld-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .ld-section-title-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ld-section-title {
      font-size: 16px;
      font-weight: 700;
      color: #212529;
    }
    .ld-section-count {
      background: #E8F5E9;
      color: #2E7D32;
      border-radius: 20px;
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 700;
    }

    /* ── LAYANAN GRID 2 COLS ── */
    .ld-layanan-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;
    }

    /* ── BUTTONS ── */
    .ld-btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: #2E7D32;
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 9px 18px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .ld-btn-primary:hover { background: #1B5E20; }
    .ld-btn-secondary {
      background: #f1f3f5;
      color: #495057;
      border: none;
      border-radius: 10px;
      padding: 9px 18px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      transition: background 0.2s;
    }
    .ld-btn-secondary:hover { background: #e2e6ea; }
    .ld-btn-icon-edit {
      background: #E8F5E9;
      border: none;
      border-radius: 8px;
      padding: 7px;
      cursor: pointer;
      color: #2E7D32;
      display: flex;
      align-items: center;
      transition: background 0.15s;
    }
    .ld-btn-icon-edit:hover { background: #C8E6C9; }
    .ld-btn-icon-delete {
      background: #FFEBEE;
      border: none;
      border-radius: 8px;
      padding: 7px;
      cursor: pointer;
      color: #C62828;
      display: flex;
      align-items: center;
      transition: background 0.15s;
    }
    .ld-btn-icon-delete:hover { background: #FFCDD2; }

    /* ── EMPTY STATE ── */
    .ld-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 20px;
      color: #adb5bd;
      text-align: center;
    }
    .ld-empty-icon {
      font-size: 40px;
    }

    /* ── SPINNER ── */
    .ld-spinner {
      width: 40px; height: 40px;
      border: 4px solid #e9ecef;
      border-top-color: #2E7D32;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .ld-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 12px;
      color: #6c757d;
    }

    /* ── MODAL ── */
    .ld-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(3px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }
    .ld-modal {
      background: #fff;
      border-radius: 20px;
      padding: 28px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      max-height: 90vh;
      overflow-y: auto;
    }
    .ld-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .ld-modal-title {
      font-size: 18px;
      font-weight: 700;
      color: #212529;
    }
    .ld-modal-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #6c757d;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: 6px;
      transition: background 0.15s;
    }
    .ld-modal-close:hover { background: #f1f3f5; }
    .ld-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
    }
    .ld-form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }
    .ld-label {
      font-size: 13px;
      font-weight: 600;
      color: #495057;
    }
    .ld-input {
      border: 1.5px solid #dee2e6;
      border-radius: 10px;
      padding: 9px 13px;
      font-size: 14px;
      outline: none;
      color: #212529;
      font-family: 'Inter', sans-serif;
      transition: border-color 0.2s;
    }
    .ld-input:focus { border-color: #2E7D32; }
    .ld-select {
      border: 1.5px solid #dee2e6;
      border-radius: 10px;
      padding: 9px 13px;
      font-size: 14px;
      outline: none;
      color: #212529;
      font-family: 'Inter', sans-serif;
      background: #fff;
      cursor: pointer;
      width: 100%;
    }
    .ld-select:focus { border-color: #2E7D32; }

    /* ── BACK BTN ── */
    .ld-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: #2E7D32;
      font-size: 0.92rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      margin-bottom: 22px;
      transition: color 0.15s;
    }
    .ld-back-btn:hover { color: #1B5E20; }

    /* ── INFO BANNER ── */
    .ld-info-banner {
      background: #E8F5E9;
      border: 1px solid #A5D6A7;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      color: #2E7D32;
      margin-bottom: 24px;
      font-weight: 500;
    }

    /* ── SEARCH WRAP ── */
    .ld-search-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f5f7fa;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 14px;
      transition: border-color 0.2s;
      min-width: 280px;
    }
    .ld-search-wrap:focus-within {
      border-color: #2E7D32;
      background: #fff;
    }
    .ld-search-input {
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.9rem;
      color: #334155;
      width: 100%;
      font-family: 'Inter', sans-serif;
    }
    .ld-search-input::placeholder { color: #b0b8c8; }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .ld-detail-profile-card { flex-direction: column; }
      .ld-detail-photo-wrap { width: 100%; height: 240px; }
      .ld-detail-info { padding: 20px; }
      .ld-jadwal-row { grid-template-columns: 70px 1fr auto; }
      .ld-layanan-grid { grid-template-columns: 1fr; }
      .ld-detail-stats { flex-wrap: wrap; gap: 10px; }
    }
  `;
  document.head.appendChild(style);
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: '#E8F5E9', border: '#2E7D32', color: '#2E7D32' },
    error:   { bg: '#FFEBEE', border: '#C62828', color: '#C62828' },
    info:    { bg: '#E3F2FD', border: '#1565C0', color: '#1565C0' },
  };
  const c = colors[type] || colors.info;

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      padding: '12px 20px', borderRadius: '10px', fontWeight: 600, fontSize: '14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: '10px',
      animation: 'slideInUp 0.3s ease',
    }}>
      {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, padding: 0 }}>
        <IconClose />
      </button>
    </div>
  );
}

// ============================================================
// MODAL: TAMBAH / EDIT JADWAL
// ============================================================
function ModalJadwal({ isOpen, onClose, onSave, jadwal, fasilitasList }) {
  const [form, setForm] = useState({
    hari: 'Senin',
    jam_mulai: '08:00',
    jam_selesai: '12:00',
    fasilitas_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (jadwal) {
        setForm({
          hari: jadwal.hari || 'Senin',
          jam_mulai: jadwal.jam_mulai?.slice(0, 5) || '08:00',
          jam_selesai: jadwal.jam_selesai?.slice(0, 5) || '12:00',
          fasilitas_id: String(jadwal.fasilitas_id || ''),
        });
      } else {
        setForm({
          hari: 'Senin',
          jam_mulai: '08:00',
          jam_selesai: '12:00',
          fasilitas_id: fasilitasList?.[0]?.fasilitas_id ? String(fasilitasList[0].fasilitas_id) : '',
        });
      }
    }
  }, [jadwal, isOpen, fasilitasList]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fasilitas_id) return alert('Pilih fasilitas/klinik terlebih dahulu.');
    if (form.jam_mulai >= form.jam_selesai) return alert('Jam mulai harus lebih awal dari jam selesai.');
    onSave(form);
  };

  return (
    <div className="ld-overlay" onClick={onClose}>
      <div className="ld-modal" onClick={e => e.stopPropagation()}>
        <div className="ld-modal-header">
          <h3 className="ld-modal-title">{jadwal ? '✏️ Edit Jadwal' : '➕ Tambah Jadwal'}</h3>
          <button className="ld-modal-close" onClick={onClose}><IconClose /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="ld-form-group">
            <label className="ld-label">Hari Praktek</label>
            <select
              className="ld-select"
              value={form.hari}
              onChange={e => setForm({ ...form, hari: e.target.value })}
            >
              {HARI_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="ld-form-group">
              <label className="ld-label">Jam Mulai</label>
              <input
                type="time"
                className="ld-input"
                value={form.jam_mulai}
                onChange={e => setForm({ ...form, jam_mulai: e.target.value })}
                required
              />
            </div>
            <div className="ld-form-group">
              <label className="ld-label">Jam Selesai</label>
              <input
                type="time"
                className="ld-input"
                value={form.jam_selesai}
                onChange={e => setForm({ ...form, jam_selesai: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="ld-form-group">
            <label className="ld-label">Fasilitas / Klinik</label>
            <select
              className="ld-select"
              value={form.fasilitas_id}
              onChange={e => setForm({ ...form, fasilitas_id: e.target.value })}
              required
            >
              <option value="">-- Pilih Fasilitas --</option>
              {fasilitasList?.map(f => (
                <option key={f.fasilitas_id} value={String(f.fasilitas_id)}>
                  {f.title || f.nama_fasilitas || `Fasilitas #${f.fasilitas_id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="ld-modal-footer">
            <button type="button" className="ld-btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="ld-btn-primary">
              {jadwal ? 'Simpan Perubahan' : 'Tambah Jadwal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MODAL: KELOLA LAYANAN DOKTER
// ============================================================
function ModalLayanan({ isOpen, onClose, onSave, selectedLayanan, allLayanan, serverBase }) {
  const [checked, setChecked] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setChecked(selectedLayanan?.map(l => l.layanan_id) || []);
    }
  }, [selectedLayanan, isOpen]);

  if (!isOpen) return null;

  const toggle = (id) => {
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => setChecked(allLayanan.map(l => l.layanan_id));
  const clearAll  = () => setChecked([]);

  return (
    <div className="ld-overlay" onClick={onClose}>
      <div className="ld-modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <div className="ld-modal-header">
          <h3 className="ld-modal-title">🏷️ Kelola Layanan Dokter</h3>
          <button className="ld-modal-close" onClick={onClose}><IconClose /></button>
        </div>
        <p style={{ color: '#6c757d', fontSize: '13px', marginBottom: '12px' }}>
          Centang layanan yang tersedia untuk dokter ini.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
          <button onClick={selectAll} className="ld-btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
            Pilih Semua
          </button>
          <button onClick={clearAll} className="ld-btn-secondary" style={{ fontSize: '12px', padding: '5px 12px' }}>
            Kosongkan
          </button>
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6c757d', fontWeight: 600 }}>
            {checked.length} / {allLayanan?.length} dipilih
          </span>
        </div>
        <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {allLayanan?.length === 0 ? (
            <p style={{ color: '#adb5bd', textAlign: 'center', padding: '20px' }}>Tidak ada layanan tersedia</p>
          ) : allLayanan?.map(l => {
            const isChecked = checked.includes(l.layanan_id);
            const imgUrl = l.image_path ? `${serverBase}/${l.image_path}` : null;
            return (
              <label key={l.layanan_id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '12px', cursor: 'pointer',
                border: isChecked ? '2px solid #2E7D32' : '2px solid #e9ecef',
                background: isChecked ? '#E8F5E9' : '#fff',
                transition: 'all 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(l.layanan_id)}
                  style={{ width: '17px', height: '17px', accentColor: '#2E7D32', cursor: 'pointer', flexShrink: 0 }}
                />
                {/* Gambar layanan kecil */}
                <div style={{
                  width: 32, height: 32, borderRadius: 8, overflow: 'hidden',
                  background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt={l.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: 14 }}>👁️</span>
                  )}
                </div>
                <span style={{ fontSize: '13px', fontWeight: isChecked ? 600 : 400, color: '#212529', flex: 1 }}>
                  {l.label}
                </span>
                {isChecked && (
                  <span style={{ color: '#2E7D32', flexShrink: 0 }}><IconCheck /></span>
                )}
              </label>
            );
          })}
        </div>
        <div className="ld-modal-footer">
          <button className="ld-btn-secondary" onClick={onClose}>Batal</button>
          <button className="ld-btn-primary" onClick={() => onSave(checked)}>
            💾 Simpan Layanan
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VIEW: DETAIL DOKTER
// ============================================================
function DetailDokter({ dokter, onBack, showToast, onRefreshList }) {
  const [jadwalList, setJadwalList]     = useState([]);
  const [layananList, setLayananList]   = useState([]);
  const [allLayanan, setAllLayanan]     = useState([]);
  const [fasilitasList, setFasilitasList] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modalJadwal, setModalJadwal]   = useState({ open: false, data: null });
  const [modalLayanan, setModalLayanan] = useState(false);

  const token   = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };
  const serverBase = (api.defaults.baseURL || '').replace('/api', '');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [jadwalRes, layananRes, allLayananRes, fasRes] = await Promise.all([
        api.get(`/admin/layanan-dokter/jadwal/${dokter.id}`, { headers }),
        api.get(`/admin/layanan-dokter/layanan/${dokter.id}`, { headers }),
        api.get('/admin/layanan-dokter/all-layanan', { headers }),
        api.get('/admin/layanan-dokter/fasilitas', { headers }),
      ]);
      setJadwalList(jadwalRes.data.data || []);
      setLayananList(layananRes.data.data || []);
      setAllLayanan(allLayananRes.data.data || []);
      setFasilitasList(fasRes.data.data || []);
    } catch (err) {
      showToast('Gagal memuat detail dokter: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  }, [dokter.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // --- Jadwal CRUD ---
  const handleSaveJadwal = async (formData) => {
    try {
      if (modalJadwal.data) {
        await api.put(`/admin/layanan-dokter/jadwal/${modalJadwal.data.id}`, formData, { headers });
        showToast('Jadwal berhasil diperbarui ✅', 'success');
      } else {
        await api.post('/admin/layanan-dokter/jadwal', { dokter_id: dokter.id, ...formData }, { headers });
        showToast('Jadwal berhasil ditambahkan ✅', 'success');
      }
      setModalJadwal({ open: false, data: null });
      fetchDetail();
      onRefreshList?.();
    } catch (err) {
      showToast('Gagal menyimpan jadwal: ' + (err.response?.data?.message || 'Terjadi kesalahan'), 'error');
    }
  };

  const handleDeleteJadwal = async (id) => {
    if (!window.confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      await api.delete(`/admin/layanan-dokter/jadwal/${id}`, { headers });
      showToast('Jadwal berhasil dihapus 🗑️', 'success');
      fetchDetail();
      onRefreshList?.();
    } catch {
      showToast('Gagal menghapus jadwal', 'error');
    }
  };

  // --- Layanan CRUD ---
  const handleSaveLayanan = async (layananIds) => {
    try {
      await api.put(
        `/admin/layanan-dokter/layanan/${dokter.id}`,
        { layanan_ids: layananIds },
        { headers }
      );
      showToast('Layanan dokter berhasil diperbarui ✅', 'success');
      setModalLayanan(false);
      fetchDetail();
      onRefreshList?.();
    } catch {
      showToast('Gagal memperbarui layanan', 'error');
    }
  };

  const fotoUrl = dokter.foto ? `${serverBase}/${dokter.foto}` : null;

  // Group jadwal by hari (urut sesuai HARI_OPTIONS)
  const jadwalByHari = HARI_OPTIONS.reduce((acc, hari) => {
    const items = jadwalList.filter(j => j.hari === hari);
    if (items.length > 0) acc[hari] = items;
    return acc;
  }, {});

  return (
    <div>
      {/* Back Button */}
      <button className="ld-back-btn" onClick={onBack}>
        <IconBack /> Kembali ke Daftar Dokter
      </button>

      {loading ? (
        <div className="ld-loading">
          <div className="ld-spinner" />
          <p>Memuat data...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── PROFILE CARD (mirip DokterDetail) ── */}
          <div className="ld-detail-profile-card">
            <div className="ld-detail-photo-wrap">
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt={dokter.nama_dokter}
                  className="ld-detail-photo"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="ld-detail-photo-placeholder"><IconUser /></div>
              )}
            </div>
            <div className="ld-detail-info">
              <div className="ld-detail-badge">{dokter.spesialis}</div>
              <h1 className="ld-detail-name">{dokter.nama_dokter}</h1>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                ID Dokter: <strong>#{dokter.id}</strong>
              </p>
              <div className="ld-detail-stats">
                <div className="ld-stat-box">
                  <span className="ld-stat-number">{jadwalList.length}</span>
                  <span className="ld-stat-label">Jadwal</span>
                </div>
                <div className="ld-stat-box">
                  <span className="ld-stat-number">{layananList.length}</span>
                  <span className="ld-stat-label">Layanan</span>
                </div>
                <div className="ld-stat-box">
                  <span className="ld-stat-number">{Object.keys(jadwalByHari).length}</span>
                  <span className="ld-stat-label">Hari Praktek</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── SECTION LAYANAN ── */}
          <div className="ld-section-card">
            <div className="ld-section-header">
              <div className="ld-section-title-wrap">
                <IconTag />
                <h4 className="ld-section-title">Layanan Dokter</h4>
                {layananList.length > 0 && (
                  <span className="ld-section-count">{layananList.length}</span>
                )}
              </div>
              <button className="ld-btn-primary" onClick={() => setModalLayanan(true)}>
                <IconEdit /> Kelola Layanan
              </button>
            </div>

            {layananList.length === 0 ? (
              <div className="ld-empty">
                <div className="ld-empty-icon">🏷️</div>
                <p style={{ fontWeight: 600, color: '#6c757d' }}>Belum ada layanan</p>
                <p style={{ fontSize: '13px', color: '#adb5bd' }}>
                  Klik <strong>"Kelola Layanan"</strong> untuk menambahkan layanan dokter ini.
                </p>
              </div>
            ) : (
              <div className="ld-layanan-grid">
                {layananList.map(l => {
                  const imgUrl = l.image_path ? `${serverBase}/${l.image_path}` : null;
                  return (
                    <div key={l.layanan_id} className="ld-layanan-item">
                      <div className="ld-layanan-icon-wrap">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={l.label}
                            onError={e => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span style={{ fontSize: 16, display: imgUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>👁️</span>
                      </div>
                      <span className="ld-layanan-label">{l.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── SECTION JADWAL ── */}
          <div className="ld-section-card">
            <div className="ld-section-header">
              <div className="ld-section-title-wrap">
                <IconCalendar />
                <h4 className="ld-section-title">Jadwal Praktek</h4>
                {jadwalList.length > 0 && (
                  <span className="ld-section-count">{jadwalList.length}</span>
                )}
              </div>
              <button className="ld-btn-primary" onClick={() => setModalJadwal({ open: true, data: null })}>
                <IconPlus /> Tambah Jadwal
              </button>
            </div>

            {jadwalList.length === 0 ? (
              <div className="ld-empty">
                <div className="ld-empty-icon">📅</div>
                <p style={{ fontWeight: 600, color: '#6c757d' }}>Belum ada jadwal praktek</p>
                <button className="ld-btn-primary" onClick={() => setModalJadwal({ open: true, data: null })}>
                  <IconPlus /> Tambah Jadwal Pertama
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(jadwalByHari).map(([hari, jadwals]) => {
                  const hc = HARI_COLOR[hari] || { bg: '#f1f1f1', color: '#495057', border: '#dee2e6' };
                  return jadwals.map(j => (
                    <div key={j.id} className="ld-jadwal-row">
                      {/* ── HARI (sejajar kiri) ── */}
                      <div
                        className="ld-jadwal-hari"
                        style={{ background: hc.bg, color: hc.color }}
                      >
                        {hari}
                      </div>

                      {/* ── INFO JAM + LOKASI (sejajar di tengah) ── */}
                      <div className="ld-jadwal-info">
                        <div className="ld-jadwal-jam">
                          <IconClock />
                          {j.jam_mulai?.slice(0, 5)} – {j.jam_selesai?.slice(0, 5)}
                        </div>
                        <div className="ld-jadwal-lokasi">
                          <IconHospital />
                          {j.nama_fasilitas || `Fasilitas #${j.fasilitas_id}`}
                        </div>
                      </div>

                      {/* ── ACTIONS (kanan) ── */}
                      <div className="ld-jadwal-actions">
                        <button
                          className="ld-btn-icon-edit"
                          onClick={() => setModalJadwal({ open: true, data: j })}
                          title="Edit Jadwal"
                        >
                          <IconEdit />
                        </button>
                        <button
                          className="ld-btn-icon-delete"
                          onClick={() => handleDeleteJadwal(j.id)}
                          title="Hapus Jadwal"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>
                  ));
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalJadwal
        isOpen={modalJadwal.open}
        onClose={() => setModalJadwal({ open: false, data: null })}
        onSave={handleSaveJadwal}
        jadwal={modalJadwal.data}
        fasilitasList={fasilitasList}
      />
      <ModalLayanan
        isOpen={modalLayanan}
        onClose={() => setModalLayanan(false)}
        onSave={handleSaveLayanan}
        selectedLayanan={layananList}
        allLayanan={allLayanan}
        serverBase={serverBase}
      />
    </div>
  );
}

// ============================================================
// MAIN PAGE: LAYANAN DOKTER (Grid Kartu Dokter)
// ============================================================
function LayananDokter() {
  const [dokterList, setDokterList]         = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [search, setSearch]                 = useState('');
  const [loading, setLoading]               = useState(true);
  const [selectedDokter, setSelectedDokter] = useState(null);
  const [toast, setToast]                   = useState(null);

  // ── State untuk Pagination ──
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4; // Menampilkan 4 data per halaman

  const token   = localStorage.getItem('adminToken');
  const headers = { Authorization: `Bearer ${token}` };
  const serverBase = (api.defaults.baseURL || '').replace('/api', '');

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const fetchDokter = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get('/admin/layanan-dokter/dokter', { headers });
      const data = res.data.data || [];
      setDokterList(data);
      setFiltered(data);
    } catch (err) {
      showToast('Gagal memuat data dokter: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchDokter(); }, [fetchDokter]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(dokterList.filter(d =>
      d.nama_dokter?.toLowerCase().includes(q) ||
      d.spesialis?.toLowerCase().includes(q)
    ));
    // Reset halaman ke 1 setiap kali user mengetik pencarian
    setCurrentPage(1);
  }, [search, dokterList]);

  // ── Logika Pagination ──
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentDokters = filtered.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // ── Detail View ──
  if (selectedDokter) {
    return (
      <div className="crud-page">
        <DetailDokter
          dokter={selectedDokter}
          onBack={() => { setSelectedDokter(null); fetchDokter(); }}
          showToast={showToast}
          onRefreshList={fetchDokter}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ── Grid View ──
  return (
    <div className="crud-page">
      {/* Header */}
      <div className="crud-page-header">
        <h1>Layanan Dokter</h1>
        <div className="ld-search-wrap">
          <IconSearch />
          <input
            className="ld-search-input"
            placeholder="Cari nama atau spesialis dokter..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Bar */}
      {!loading && dokterList.length > 0 && (
        <div className="users-summary-bar">
          <span className="users-count-label">
            Menampilkan <strong>{filtered.length === 0 ? 0 : indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filtered.length)}</strong> dari <strong>{filtered.length}</strong> dokter
          </span>
        </div>
      )}

      {/* Info Banner */}
      <div className="ld-info-banner">
        💡 Klik kartu dokter untuk mengelola layanan dan jadwal prakteknya.
      </div>

      {/* Content */}
      {loading ? (
        <div className="ld-loading">
          <div className="ld-spinner" />
          <p style={{ color: '#6c757d' }}>Memuat data dokter...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-icon">🩺</div>
          <p>{dokterList.length === 0 ? 'Belum ada data dokter.' : 'Tidak ada dokter ditemukan.'}</p>
          {search && <small>Coba ubah kata kunci pencarian Anda.</small>}
        </div>
      ) : (
        <>
          <div className="ld-card-grid">
            {/* Menggunakan currentDokters agar tampil 4 per halaman */}
            {currentDokters.map(dokter => {
              const fotoUrl = dokter.foto ? `${serverBase}/${dokter.foto}` : null;
              return (
                <div
                  key={dokter.id}
                  className="ld-card"
                  onClick={() => setSelectedDokter(dokter)}
                >
                  {/* ── Foto ── */}
                  <div className="ld-card-photo-wrap">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={dokter.nama_dokter}
                        className="ld-card-photo"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="ld-card-photo-placeholder"><IconUser /></div>
                    )}
                    {/* Overlay hover dengan stats */}
                    <div className="ld-card-overlay">
                      <span className="ld-overlay-badge">📅 {dokter.total_jadwal || 0} jadwal</span>
                      <span className="ld-overlay-badge">🏷️ {dokter.total_layanan || 0} layanan</span>
                    </div>
                  </div>

                  {/* ── Body ── */}
                  <div className="ld-card-body">
                    <h3 className="ld-card-name">{dokter.nama_dokter}</h3>
                    <span className="ld-card-spesialis">{dokter.spesialis}</span>
                    <div className="ld-card-meta">
                      <span className="ld-card-meta-item">
                        <IconCalendar /> {dokter.total_jadwal || 0} jadwal
                      </span>
                      <span className="ld-card-meta-item">
                        <IconTag /> {dokter.total_layanan || 0} layanan
                      </span>
                    </div>
                  </div>

                  {/* ── Action Footer ── */}
                  <div className="ld-card-actions" onClick={e => e.stopPropagation()}>
                    <button
                      className="ld-card-action-btn manage"
                      onClick={() => setSelectedDokter(dokter)}
                      title="Kelola Jadwal & Layanan"
                    >
                      <IconCalendar /> Jadwal
                    </button>
                    <button
                      className="ld-card-action-btn"
                      onClick={() => setSelectedDokter(dokter)}
                      title="Kelola Layanan"
                    >
                      <IconTag /> Layanan
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Kontrol Pagination ── */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="pagination-btn" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &laquo; Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="pagination-btn" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next &raquo;
              </button>
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default LayananDokter;