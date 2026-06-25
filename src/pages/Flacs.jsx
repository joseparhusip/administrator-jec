import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import '../css/style.css';

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const ExcelIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
            fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 13H16M8 17H16M10 9H14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;
const LOGO_JEC_URL = '/jec-logo.png';

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .bk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
    margin-top: 0.5rem;
  }
  @media(max-width: 600px) { .bk-grid { grid-template-columns: 1fr 1fr; gap: 0.75rem; } }
  @media(max-width: 400px) { .bk-grid { grid-template-columns: 1fr; } }

  .bk-card {
    background: #fff;
    border-radius: 16px;
    border: 1.5px solid #e4f0e8;
    box-shadow: 0 2px 12px rgba(20,160,88,.07);
    overflow: hidden;
    cursor: pointer;
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
    display: flex;
    flex-direction: column;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .bk-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(20,160,88,.16);
    border-color: #14a058;
  }
  .bk-card.new-booking-highlight {
    border-color: #14a058 !important;
    box-shadow: 0 0 0 3px rgba(20,160,88,.25), 0 12px 32px rgba(20,160,88,.2) !important;
    animation: newCardPulse 2s ease infinite;
  }
  @keyframes newCardPulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(20,160,88,.25), 0 8px 24px rgba(20,160,88,.15); }
    50%       { box-shadow: 0 0 0 6px rgba(20,160,88,.15), 0 8px 24px rgba(20,160,88,.25); }
  }

  .bk-card-invoice-bar {
    background: linear-gradient(135deg, #0a5c36 0%, #14a058 60%, #1dd97a 100%);
    padding: 9px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    flex-shrink: 0;
  }
  .bk-card-invoice-label {
    font-size: .65rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: rgba(255,255,255,.75);
  }
  .bk-card-invoice-no {
    font-size: .82rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  .bk-card-body {
    padding: 14px 14px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex: 1;
  }
  .bk-card-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #14a058;
    display: block;
  }
  .bk-card-user-name {
    font-size: .92rem;
    font-weight: 800;
    color: #0a2e1a;
    text-align: center;
    margin: 0;
    line-height: 1.3;
  }
  .bk-card-pasien {
    font-size: .75rem;
    color: #666;
    text-align: center;
    margin: 0;
  }
  .bk-card-date {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #edf9f2;
    color: #0b6e38;
    border-radius: 7px;
    padding: 4px 10px;
    font-size: .72rem;
    font-weight: 700;
    margin-top: 2px;
  }

  .bk-card-footer {
    padding: 8px 12px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-top: 1px solid #f0f6f2;
    margin-top: auto;
  }
  .bk-status-chip {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: .65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .05em;
    white-space: nowrap;
  }
  .bk-status-chip.success { background: #d4f5e2; color: #0b7a3e; }
  .bk-status-chip.warning { background: #fff3cd; color: #856404; }
  .bk-status-chip.danger  { background: #fde8e8; color: #c0392b; }
  .bk-status-chip.secondary { background: #eee; color: #555; }

  .bk-card-delete-btn {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 4px 10px; border-radius: 7px;
    background: #fff5f5; border: 1px solid #fda5a5;
    color: #dc3545; font-size: .68rem; font-weight: 700;
    cursor: pointer; font-family: inherit;
    transition: background .15s;
    flex-shrink: 0;
  }
  .bk-card-delete-btn:hover { background: #fde8e8; }

  .bk-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 3rem 1rem; gap: 1rem; color: #666;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .bk-spinner {
    width: 36px; height: 36px;
    border: 3px solid #d4f5e2; border-top-color: #14a058;
    border-radius: 50%; animation: bk-spin .7s linear infinite;
  }
  @keyframes bk-spin { to { transform: rotate(360deg); } }

  .bk-empty {
    text-align: center; padding: 3rem 1rem; color: #888;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .bk-empty-icon { font-size: 3rem; margin-bottom: .75rem; }

  .flacs-overlay {
    position: fixed; inset: 0; z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    background: rgba(10,20,15,.65);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    animation: overlayIn .2s ease;
  }
  @keyframes overlayIn { from{opacity:0} to{opacity:1} }

  .flacs-modal {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #fff; border-radius: 20px;
    max-width: 820px; width: 95%; max-height: 92vh;
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.04);
    animation: modalIn .28s cubic-bezier(.34,1.3,.64,1);
  }
  @keyframes modalIn {
    from{opacity:0;transform:scale(.93) translateY(16px)}
    to{opacity:1;transform:scale(1) translateY(0)}
  }

  .fm-hero {
    position: relative;
    background: linear-gradient(135deg,#0a5c36 0%,#14a058 55%,#1dd97a 100%);
    padding: 28px 32px; overflow: hidden; flex-shrink: 0;
  }
  .fm-hero::before {
    content:''; position:absolute; inset:0;
    background: url("data:image/svg+xml,%3Csvg width='400' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='350' cy='30' r='160' fill='white' fill-opacity='.04'/%3E%3Ccircle cx='30' cy='180' r='120' fill='white' fill-opacity='.05'/%3E%3C/svg%3E") no-repeat center/cover;
    pointer-events: none;
  }
  .fm-hero-top { display:flex; justify-content:space-between; align-items:flex-start; position:relative; z-index:1; }
  .fm-hero-badge {
    background:rgba(255,255,255,.18); border:1px solid rgba(255,255,255,.3);
    color:#fff; font-size:.7rem; font-weight:700; letter-spacing:.08em;
    text-transform:uppercase; padding:4px 10px; border-radius:20px;
    margin-bottom:8px; display:inline-block;
  }
  .fm-hero-invoice { color:#fff; font-size:1.25rem; font-weight:800; letter-spacing:-.01em; }
  .fm-close-btn {
    background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.25);
    color:#fff; width:36px; height:36px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; font-size:1.2rem; line-height:1; flex-shrink:0;
  }

  .fm-body { padding:24px 32px; overflow-y:auto; flex:1; }

  .fm-user-card {
    background:#fff; border-radius:14px; border:1.5px solid #e4f0e8;
    box-shadow:0 4px 16px rgba(20,160,88,.08);
    padding:18px 22px; display:flex; align-items:center; gap:16px; margin-bottom:20px;
  }
  .fm-avatar { width:58px; height:58px; border-radius:50%; object-fit:cover; border:3px solid #14a058; flex-shrink:0; }
  .fm-user-name { font-size:1.05rem; font-weight:800; color:#0a2e1a; margin:0 0 2px; }
  .fm-user-email { font-size:.82rem; color:#666; margin:0 0 2px; }
  .fm-user-loc { font-size:.75rem; color:#aaa; margin:0; }

  .fm-status-select-wrap { margin-left:auto; flex-shrink:0; }
  .fm-status-select {
    padding: 6px 12px; border-radius: 20px;
    font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
    border: 1.5px solid transparent; cursor: pointer; outline: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: box-shadow .15s;
  }
  .fm-status-select:focus { box-shadow: 0 0 0 3px rgba(20,160,88,.2); }
  .fm-status-select.success { background:#d4f5e2; color:#0b7a3e; border-color:#a3e6c1; }
  .fm-status-select.warning { background:#fff3cd; color:#856404; border-color:#ffe082; }
  .fm-status-select.danger  { background:#fde8e8; color:#c0392b; border-color:#fca5a5; }
  .fm-status-select.secondary { background:#eee; color:#555; border-color:#ddd; }

  .fm-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  @media(max-width:600px){ .fm-grid{grid-template-columns:1fr;} }

  .fm-card { border-radius:14px; border:1.5px solid #e8ede9; padding:22px; background:#fcfffe; }
  .fm-card-title {
    font-size:.7rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase;
    color:#14a058; margin:0 0 16px; padding-bottom:10px; border-bottom:1.5px solid #e4f5eb;
  }
  .fm-field { margin-bottom:14px; }
  .fm-field:last-child { margin-bottom:0; }
  .fm-label { font-size:.72rem; color:#aaa; font-weight:600; text-transform:uppercase; letter-spacing:.07em; margin-bottom:3px; }
  .fm-value { font-size:.95rem; color:#1a1a1a; font-weight:700; margin:0; }
  .fm-value.phone { font-size:1.1rem; letter-spacing:.02em; }
  .fm-date-chip {
    display:inline-flex; align-items:center; gap:6px;
    background:linear-gradient(90deg,#d4f5e2,#e8fbf0);
    color:#0b6e38; padding:6px 14px; border-radius:8px;
    font-size:.9rem; font-weight:700; margin-top:4px;
  }
  .fm-entity-row {
    display:flex; align-items:center; gap:12px; padding:12px 14px;
    border-radius:10px; background:#f8fdf9; border:1px solid #e4f0e8; margin-bottom:10px;
  }
  .fm-entity-row:last-child { margin-bottom:0; }
  .fm-entity-img { width:44px; height:44px; border-radius:10px; object-fit:cover; flex-shrink:0; border:1px solid #ddd; }
  .fm-entity-img.round { border-radius:50%; }
  .fm-entity-name { font-size:.92rem; font-weight:700; color:#1a1a1a; margin:0 0 2px; }
  .fm-entity-sub { font-size:.75rem; color:#888; margin:0; }
  .fm-entity-type {
    margin-left:auto; flex-shrink:0; font-size:.65rem; font-weight:700;
    text-transform:uppercase; background:#e4f5eb; color:#14a058; padding:3px 8px; border-radius:6px;
  }

  .fm-footer {
    padding:18px 32px; border-top:1.5px solid #f0f0f0;
    display:flex; gap:10px; justify-content:flex-end; background:#fafafa;
  }
  .fm-btn {
    padding:10px 22px; border-radius:10px;
    font-family:'Plus Jakarta Sans',sans-serif; font-size:.85rem; font-weight:700;
    cursor:pointer; display:flex; align-items:center; gap:7px; border:none;
  }
  .fm-btn-ghost { background:transparent; border:1.5px solid #ddd; color:#555; }
  .fm-btn-print { background:#eaf7f5; color:#0d7a6a; border:1.5px solid #b3e8e1; }
  .fm-btn-pdf { background:linear-gradient(135deg,#0a5c36,#14a058); color:#fff; box-shadow:0 4px 12px rgba(20,160,88,.35); }

  .bk-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #0a5c36; color: #fff; padding: 12px 24px; border-radius: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: .88rem; font-weight: 700;
    box-shadow: 0 8px 24px rgba(0,0,0,.2); z-index: 9999;
    animation: toastIn .25s ease;
  }
  @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  .bk-confirm-overlay {
    position: fixed; inset: 0; z-index: 1100;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,.45); backdrop-filter: blur(4px);
  }
  .bk-confirm-box {
    background: #fff; border-radius: 16px; padding: 28px 32px;
    max-width: 360px; width: 90%; text-align: center;
    box-shadow: 0 24px 60px rgba(0,0,0,.18);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .bk-confirm-icon { font-size: 2.5rem; margin-bottom: 12px; }
  .bk-confirm-title { font-size: 1.05rem; font-weight: 800; color: #1a1a1a; margin: 0 0 8px; }
  .bk-confirm-desc { font-size: .875rem; color: #666; margin: 0 0 22px; line-height: 1.5; }
  .bk-confirm-actions { display: flex; gap: 10px; justify-content: center; }
  .bk-confirm-cancel {
    padding: 10px 22px; border-radius: 10px; border: 1.5px solid #ddd;
    background: #fff; color: #555; font-weight: 700; cursor: pointer;
    font-family: inherit; font-size: .875rem;
  }
  .bk-confirm-del {
    padding: 10px 22px; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #c0392b, #e74c3c); color: #fff;
    font-weight: 700; cursor: pointer; font-family: inherit; font-size: .875rem;
    box-shadow: 0 4px 12px rgba(220,53,69,.35);
  }

  .bk-filter-bar {
    display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 1rem; align-items: center;
  }
  .bk-filter-chip {
    padding: 6px 14px; border-radius: 20px; border: 1.5px solid #ddd;
    background: #fff; color: #555; font-size: .78rem; font-weight: 700;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all .15s;
  }
  .bk-filter-chip.active {
    background: #14a058; border-color: #14a058; color: #fff;
    box-shadow: 0 3px 10px rgba(20,160,88,.3);
  }
  .bk-search-input {
    padding: 7px 14px; border-radius: 10px; border: 1.5px solid #ddd;
    font-size: .85rem; font-family: 'Plus Jakarta Sans', sans-serif;
    outline: none; min-width: 200px; transition: border-color .15s;
  }
  .bk-search-input:focus { border-color: #14a058; }

  .bk-excel-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 16px; border-radius: 10px; border: none;
    background: #1D6F42; color: #fff;
    font-size: .78rem; font-weight: 700;
    cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
    box-shadow: 0 2px 8px rgba(29,111,66,.28);
    transition: background .15s, transform .15s;
    white-space: nowrap;
    margin-left: auto;
  }
  .bk-excel-btn:hover:not(:disabled) { background: #155534; transform: translateY(-1px); }
  .bk-excel-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Notifikasi Toast Modern (INLINE) ── */
  @keyframes slideInRight {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  .flacs-notif-inline {
    background: #fff;
    border-left: 4px solid #14a058;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    padding: 6px 12px;
    display: flex; align-items: center; gap: 10px;
    animation: slideInRight 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
    font-family: 'Plus Jakarta Sans', sans-serif;
    white-space: nowrap;
  }
  .flacs-toast-icon {
    background: #e8fbf0; width: 28px; height: 28px;
    border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 0.9rem; flex-shrink: 0;
  }
  .flacs-toast-close {
    background: transparent; border: none; font-size: 1.2rem;
    color: #aaa; cursor: pointer; padding: 0 0 0 5px; line-height: 1; transition: color 0.2s;
  }
  .flacs-toast-close:hover { color: #333; }
`;

const Flacs = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const [toastNotif, setToastNotif] = useState(null);
    const notifAudioRef = useRef(null);
    const notifiedIdsRef = useRef(new Set());
    const isPendingRef = useRef(false);

    const getStatusLabel = (status) => {
        const s = status ? status.toLowerCase() : '';
        if (['confirmed', 'dikonfirmasi'].includes(s)) return 'Dikonfirmasi';
        if (s === 'selesai') return 'Selesai';
        if (['pending', 'menunggu'].includes(s)) return 'Menunggu';
        if (['cancelled', 'batal'].includes(s)) return 'Dibatalkan';
        return status || 'Pending';
    };

    // ── Logic Utama Audio Looping Manual ──
    useEffect(() => {
        const pendingCount = bookings.filter(b => getStatusLabel(b.status) === 'Menunggu').length;
        isPendingRef.current = pendingCount > 0;
        
        if (pendingCount > 0) {
            if (notifAudioRef.current && notifAudioRef.current.paused) {
                notifAudioRef.current.play().catch(err => {
                    console.warn('Browser memblokir autoplay. Silakan klik layar 1x agar suara otomatis keluar.', err);
                });
            }
        } else {
            if (notifAudioRef.current && !notifAudioRef.current.paused) {
                notifAudioRef.current.pause();
                notifAudioRef.current.currentTime = 0;
                setToastNotif(null); 
            }
        }
    }, [bookings]);

    // ── Inisialisasi Audio dengan Event Listener Manual ──
    useEffect(() => {
        const audio = new Audio('/src/assets/voice/flacs_masuk.mp3');
        audio.volume = 1.0;
        
        const handleEnded = () => {
            if (isPendingRef.current) {
                audio.currentTime = 0;
                audio.play().catch(err => console.warn("Autoplay ditolak:", err));
            }
        };
        
        audio.addEventListener('ended', handleEnded);
        notifAudioRef.current = audio;

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            audio.src = '';
        };
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    // ── FETCH BOOKINGS ────────────────────────────────────────────────────────
    const fetchBookings = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const response = await api.get('/admin/layanan/flacs');
            if (response.data.success) {
                const newData = response.data.data;

                setBookings(prevData => {
                    const newPendingIds = newData
                        .filter(i => getStatusLabel(i.status) === 'Menunggu')
                        .map(i => i.id);

                    const brandNewIds = newPendingIds.filter(
                        id => !notifiedIdsRef.current.has(id)
                    );

                    if (brandNewIds.length > 0) {
                        brandNewIds.forEach(id => notifiedIdsRef.current.add(id));

                        setToastNotif({
                            title: 'Booking Baru!',
                            desc: `${brandNewIds.length} pasien mendaftar FLACS.`
                        });
                    }

                    if (newPendingIds.length === 0) {
                        notifiedIdsRef.current.clear();
                    }

                    return newData;
                });
            }
        } catch (error) {
            console.error("Gagal mengambil data flacs:", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    }, []);

    // ── POLLING SETIAP 5 DETIK ───────────────────────────────────────────────
    useEffect(() => {
        fetchBookings(false);
        const interval = setInterval(() => fetchBookings(true), 5000);
        return () => clearInterval(interval);
    }, [fetchBookings]);

    // LOGIKA AUTO OPEN MODAL DARI DASHBOARD
    useEffect(() => {
        if (bookings.length > 0 && location.state?.openDetailId) {
            const targetId = location.state.openDetailId;
            const itemToOpen = bookings.find(b => b.id === targetId);
            if (itemToOpen) {
                setSelectedDetail(itemToOpen);
                setShowDetailModal(true);
            }
            navigate('.', { replace: true, state: {} });
        }
    }, [bookings, location.state, navigate]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/admin/layanan/flacs/${id}/status`, { status: newStatus });
            setBookings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
            
            if (selectedDetail && selectedDetail.id === id) {
                setSelectedDetail(prev => ({ ...prev, status: newStatus }));
            }
            showToast(`Status diubah → ${newStatus}`);

            if (getStatusLabel(newStatus) !== 'Menunggu') {
                notifiedIdsRef.current.delete(id);
            }

        } catch {
            showToast("Gagal mengubah status.");
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await api.delete(`/admin/layanan/flacs/${confirmDelete}`);
            setBookings(prev => prev.filter(item => item.id !== confirmDelete));
            if (selectedDetail && selectedDetail.id === confirmDelete) {
                setShowDetailModal(false); setSelectedDetail(null);
            }
            showToast("Data booking berhasil dihapus.");
        } catch { showToast("Gagal menghapus data."); }
        finally { setConfirmDelete(null); }
    };

    // ── EXPORT EXCEL ──────────────────────────────────────────────────────────
    const handleExportExcel = () => {
        if (filteredBookings.length === 0) { showToast('Tidak ada data untuk diekspor.'); return; }
        setIsExporting(true);
        try {
            const rows = filteredBookings.map((item, idx) => ({
                'No': idx + 1,
                'No Invoice': item.no_invoice || '-',
                'Nama User': item.user_name || '-',
                'Email User': item.user_email || '-',
                'Nama Pasien': item.nama_pasien || '-',
                'Nomor WhatsApp': item.nomor_wa || '-',
                'Tanggal Kedatangan': new Date(item.tgl_kedatangan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
                'Fasilitas': item.fasilitas_name || '-',
                'Dokter': item.nama_dokter || '-',
                'Spesialisasi': item.dokter_spesialis || '-',
                'Status': getStatusLabel(item.status),
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            ws['!cols'] = [
                { wch: 5 }, { wch: 22 }, { wch: 22 }, { wch: 28 },
                { wch: 22 }, { wch: 18 }, { wch: 32 },
                { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 16 },
            ];

            const statusCount = (s) => bookings.filter(b => getStatusLabel(b.status) === s).length;
            const ringkasan = [
                { 'Keterangan': 'Total Booking FLACS', 'Nilai': bookings.length },
                { 'Keterangan': 'Dikonfirmasi', 'Nilai': statusCount('Dikonfirmasi') },
                { 'Keterangan': 'Menunggu (Pending)', 'Nilai': statusCount('Menunggu') },
                { 'Keterangan': 'Selesai', 'Nilai': statusCount('Selesai') },
                { 'Keterangan': 'Dibatalkan', 'Nilai': statusCount('Dibatalkan') },
                { 'Keterangan': 'Diekspor Pada', 'Nilai': new Date().toLocaleString('id-ID') },
            ];
            const wsRing = XLSX.utils.json_to_sheet(ringkasan);
            wsRing['!cols'] = [{ wch: 28 }, { wch: 20 }];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Booking FLACS');
            XLSX.utils.book_append_sheet(wb, wsRing, 'Ringkasan');
            XLSX.writeFile(wb, `Booking_FLACS_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast('Data berhasil diekspor ke Excel!');
        } catch (err) {
            showToast('Gagal mengekspor data.');
        } finally {
            setIsExporting(false);
        }
    };

    const getStatusClass = (status) => {
        const s = status ? status.toLowerCase() : '';
        if (['confirmed', 'selesai', 'dikonfirmasi'].includes(s)) return 'success';
        if (['pending', 'menunggu'].includes(s)) return 'warning';
        if (['cancelled', 'batal'].includes(s)) return 'danger';
        return 'secondary';
    };

    const openDetail = (item) => { setSelectedDetail(item); setShowDetailModal(true); };
    const closeDetail = () => { setShowDetailModal(false); setSelectedDetail(null); };

    const getImageUrl = (imgPath, type = 'general') => {
        if (!imgPath) return null;
        if (imgPath.startsWith('http')) return imgPath;
        if (imgPath.startsWith('assets/')) return `${BASE_URL}/${imgPath}`;
        if (type === 'user') return `${BASE_URL}/assets/users/${imgPath}`;
        return `${BASE_URL}/${imgPath.startsWith('/') ? imgPath.slice(1) : imgPath}`;
    };

    const fallbackAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='80' height='80' rx='40' fill='%23e0e0e0'/><circle cx='40' cy='30' r='15' fill='%23bdbdbd'/><ellipse cx='40' cy='65' rx='22' ry='15' fill='%23bdbdbd'/></svg>`;
    const fallbackBuilding = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='80' height='80' fill='%23e3f2fd'/><rect x='15' y='25' width='50' height='40' fill='%2390caf9'/><rect x='30' y='45' width='20' height='20' fill='%231565c0'/><rect x='10' y='20' width='60' height='8' fill='%231565c0'/></svg>`;

    // ── DOWNLOAD PDF ──────────────────────────────────────────────────────────
    const handleDownloadPDF = async () => {
        if (!selectedDetail) return;
        setIsPdfLoading(true);

        const tgl = new Date(selectedDetail.tgl_kedatangan).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        const statusClass =
            ['selesai', 'dikonfirmasi', 'confirmed'].includes((selectedDetail.status || '').toLowerCase()) ? 'success' :
            ['pending', 'menunggu'].includes((selectedDetail.status || '').toLowerCase()) ? 'warning' :
            ['batal', 'cancelled', 'ditolak'].includes((selectedDetail.status || '').toLowerCase()) ? 'danger' : 'secondary';

        const statusLabel = selectedDetail.status ? selectedDetail.status.toUpperCase() : 'PENDING';

        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed; top: -99999px; left: -99999px;
            width: 794px; background: #fff;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #3c3c3c; box-sizing: border-box;
        `;

        container.innerHTML = `
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .page-container { padding: 56.69px; position: relative; min-height: 1122px; background: #fff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #3c3c3c; }
                .top-accent { background-color: #14a058 !important; height: 15px; width: 100%; position: absolute; top: 0; left: 0; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; }
                .logo-img { height: 75px; object-fit: contain; display: block; }
                .logo-fallback { font-size: 30px; font-weight: 900; color: #14a058; line-height: 1; }
                .logo-fallback span { display: block; font-size: 11px; font-weight: 400; color: #888; margin-top: 4px; }
                .invoice-title { font-size: 34px; font-weight: bold; color: #282828; margin: 0; text-align: right; line-height: 1; }
                .invoice-meta { font-size: 13px; color: #666; text-align: right; margin-top: 8px; line-height: 1.6; }
                .divider { border: none; border-top: 1px solid #e6e6e6; margin: 22px 0 26px; }
                .info-section { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 26px; }
                .info-block { width: 48%; background: #f8fcf9; border: 1px solid #d8eee2; border-radius: 8px; padding: 14px 16px; }
                .info-label { font-size: 9px; color: #14a058; font-weight: 800; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.08em; padding-bottom: 6px; border-bottom: 1px solid #d4edd9; }
                .info-value-main { font-size: 16px; font-weight: 800; color: #181818; margin-bottom: 5px; }
                .info-value-sub { font-size: 12.5px; color: #666; margin-bottom: 3px; line-height: 1.5; }
                .info-value-sub.muted { color: #aaa; font-size: 11.5px; }
                .info-value-bold { font-size: 13.5px; font-weight: 700; color: #282828; margin-top: 7px; margin-bottom: 3px; }
                .section-label { font-size: 9px; font-weight: 800; color: #14a058; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
                .section-label::after { content: ''; flex: 1; height: 1.5px; background: #14a058; opacity: 0.4; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 26px; table-layout: fixed; }
                col.col-desc { width: 34%; } col.col-dokter { width: 28%; } col.col-jadwal { width: 24%; } col.col-status { width: 14%; }
                th { background: #f0faf5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #14a058; padding: 11px 13px; text-align: left; font-size: 11px; font-weight: 800; border-top: 1.5px solid #cceadb; border-bottom: 1.5px solid #cceadb; text-transform: uppercase; letter-spacing: 0.05em; overflow: hidden; }
                th.col-status-h { text-align: center; }
                td { padding: 13px 13px; font-size: 13px; border-bottom: 1px solid #eaf4ed; color: #404040; vertical-align: middle; line-height: 1.5; overflow: hidden; }
                td.col-status-d { text-align: center; }
                td strong { color: #1a1a1a; display: block; margin-bottom: 3px; }
                td span.sub { font-size: 11.5px; color: #888; }
                .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
                .status-badge.success { background: #d4f5e2 !important; color: #0b7a3e !important; }
                .status-badge.warning { background: #fff3cd !important; color: #856404 !important; }
                .status-badge.danger  { background: #fde8e8 !important; color: #c0392b !important; }
                .status-badge.secondary { background: #eee !important; color: #555 !important; }
                .notes-title { font-size: 9px; font-weight: 800; color: #14a058; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
                .notes-box { background: #f5fcf8 !important; border: 1px solid #d0eadb; border-left: 5px solid #14a058 !important; border-radius: 6px; padding: 12px 16px; margin-bottom: 36px; }
                .notes-box p { margin: 0 0 5px; font-size: 12px; color: #555; line-height: 1.6; }
                .notes-box p:last-child { margin-bottom: 0; }
                .footer { position: absolute; bottom: 40px; left: 56.69px; right: 56.69px; text-align: center; border-top: 2px solid #14a058; padding-top: 10px; }
                .footer p.main { margin: 0 0 5px 0; font-size: 12.5px; color: #828282; }
                .footer p.sub { margin: 0; font-size: 11.5px; color: #aaa; }
            </style>
            <div class="page-container">
                <div class="top-accent"></div>
                <div class="header">
                    <div>
                        <img src="${LOGO_JEC_URL}" alt="JEC Logo" class="logo-img"
                             onerror="this.outerHTML='<div class=\\'logo-fallback\\'>JEC<span>Eye Hospitals &amp; Clinics</span></div>'" />
                    </div>
                    <div>
                        <h2 class="invoice-title">INVOICE</h2>
                        <div class="invoice-meta">
                            No. Invoice: ${selectedDetail.no_invoice}<br>
                            Dicetak Pada: ${new Date().toLocaleDateString('id-ID')}
                        </div>
                    </div>
                </div>
                <hr class="divider" />
                <div class="info-section">
                    <div class="info-block">
                        <div class="info-label">Informasi Pasien</div>
                        <div class="info-value-main">${selectedDetail.nama_pasien || '-'}</div>
                        <div class="info-value-sub">User: ${selectedDetail.user_name || '-'}</div>
                        <div class="info-value-sub">WhatsApp: ${selectedDetail.nomor_wa || '-'}</div>
                        ${selectedDetail.user_email ? `<div class="info-value-sub">Email: ${selectedDetail.user_email}</div>` : ''}
                        ${(selectedDetail.city_name || selectedDetail.province_name)
                            ? `<div class="info-value-sub muted">${[selectedDetail.district_name, selectedDetail.city_name, selectedDetail.province_name].filter(Boolean).join(', ')}</div>`
                            : ''}
                    </div>
                    <div class="info-block">
                        <div class="info-label">Lokasi &amp; Dokter</div>
                        <div class="info-value-main">${selectedDetail.fasilitas_name || '-'}</div>
                        <div class="info-value-sub">Tipe: ${selectedDetail.fasilitas_type || 'Rumah Sakit'}</div>
                        <div class="info-value-bold">${selectedDetail.nama_dokter || '-'}</div>
                        <div class="info-value-sub muted">${selectedDetail.dokter_spesialis || 'Dokter Spesialis Mata'}</div>
                    </div>
                </div>
                <div class="section-label">Detail Layanan</div>
                <table>
                    <colgroup>
                        <col class="col-desc"><col class="col-dokter"><col class="col-jadwal"><col class="col-status">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Deskripsi Layanan</th>
                            <th>Dokter Spesialis</th>
                            <th>Jadwal Kedatangan</th>
                            <th class="col-status-h">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <strong>Booking Layanan FLACS</strong>
                                <span class="sub">${selectedDetail.fasilitas_name || ''}</span>
                            </td>
                            <td>
                                <strong>${selectedDetail.nama_dokter || '-'}</strong>
                                <span class="sub">${selectedDetail.dokter_spesialis || 'Spesialis Mata'}</span>
                            </td>
                            <td>${tgl}</td>
                            <td class="col-status-d">
                                <span class="status-badge ${statusClass}">${statusLabel}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="notes-title">Catatan Penting</div>
                <div class="notes-box">
                    <p>• Harap tiba 30 menit sebelum jadwal yang ditentukan untuk proses administrasi.</p>
                    <p>• Bawa kartu identitas (KTP/SIM) dan dokumen ini sebagai bukti booking.</p>
                    <p>• Hubungi Call Center 0804-122-1000 apabila ada perubahan jadwal.</p>
                </div>
                <div class="footer">
                    <p class="main">JEC Eye Hospitals &amp; Clinics | www.jec.co.id | Call Center: 0804-122-1000</p>
                    <p class="sub">Dokumen ini dicetak secara otomatis oleh sistem dan sah tanpa tanda tangan fisik.</p>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        try {
            const logoImg = container.querySelector('.logo-img');
            if (logoImg) {
                await new Promise((resolve) => {
                    if (logoImg.complete) { resolve(); return; }
                    logoImg.onload = resolve;
                    logoImg.onerror = resolve;
                    setTimeout(resolve, 2000);
                });
            }

            const canvas = await html2canvas(container.querySelector('.page-container'), {
                scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false, width: 794,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.97);
            const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pageWidth  = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imgHeightInPt = (canvas.height / canvas.width) * pageWidth;

            let yOffset = 0;
            while (yOffset < imgHeightInPt) {
                if (yOffset > 0) doc.addPage();
                doc.addImage(imgData, 'JPEG', 0, -yOffset, pageWidth, imgHeightInPt, undefined, 'FAST');
                yOffset += pageHeight;
            }
            doc.save(`Invoice-FLACS-${selectedDetail.no_invoice}.pdf`);
        } catch (err) {
            console.error('Gagal membuat PDF:', err);
            showToast('Gagal membuat PDF. Coba lagi.');
        } finally {
            document.body.removeChild(container);
            setIsPdfLoading(false);
        }
    };

    // ── PRINT WINDOW ──────────────────────────────────────────────────────────
    const handlePrint = () => {
        if (!selectedDetail) return;
        const tgl = new Date(selectedDetail.tgl_kedatangan).toLocaleDateString('id-ID', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
        const printWindow = window.open('', '', 'height=800,width=800');
        printWindow.document.write(`
            <html><head>
                <title>Cetak Booking - ${selectedDetail.no_invoice}</title>
                <style>
                    @page { margin: 0; size: A4 portrait; }
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #3c3c3c; margin: 0; padding: 0; }
                    .page-container { padding: 15mm; position: relative; min-height: 260mm; box-sizing: border-box; }
                    .top-accent { background-color: #14a058 !important; height: 4mm; width: 100%; position: absolute; top: 0; left: 0; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-top: 5mm; }
                    .logo-img { height: 60px; object-fit: contain; }
                    .invoice-title { font-size: 28px; font-weight: bold; color: #282828; text-align: right; }
                    .invoice-meta { font-size: 12px; color: #666; text-align: right; margin-top: 6px; line-height: 1.5; }
                    .divider { border-top: 1px solid #e6e6e6; margin: 6mm 0 8mm; }
                    .info-section { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8mm; }
                    .info-block { width: 48%; background: #f8fcf9; border: 1px solid #d8eee2; border-radius: 8px; padding: 12px 14px; box-sizing: border-box; }
                    .info-label { font-size: 8px; color: #14a058; font-weight: 800; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em; padding-bottom: 4px; border-bottom: 1px solid #d4edd9; }
                    .info-value-main { font-size: 15px; font-weight: 800; color: #181818; margin-bottom: 4px; }
                    .info-value-sub { font-size: 11px; color: #666; margin-bottom: 2px; line-height: 1.4; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 8mm; }
                    th { background: #f0faf5 !important; color: #14a058; padding: 9px 12px; text-align: left; font-size: 10px; font-weight: 800; border-top: 1.5px solid #cceadb; border-bottom: 1.5px solid #cceadb; text-transform: uppercase; }
                    td { padding: 11px 12px; font-size: 12px; border-bottom: 1px solid #eaf4ed; color: #404040; vertical-align: middle; line-height: 1.5; }
                    td strong { color: #1a1a1a; display: block; margin-bottom: 2px; }
                    td span.sub { font-size: 10px; color: #888; }
                    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; white-space: nowrap; }
                    .status-badge.success { background: #d4f5e2 !important; color: #0b7a3e !important; }
                    .status-badge.warning { background: #fff3cd !important; color: #856404 !important; }
                    .status-badge.danger  { background: #fde8e8 !important; color: #c0392b !important; }
                    .status-badge.secondary { background: #eee !important; color: #555 !important; }
                    .notes-box { background: #f5fcf8 !important; border: 1px solid #d0eadb; border-left: 5px solid #14a058 !important; border-radius: 6px; padding: 10px 14px; margin-bottom: 8mm; }
                    .notes-box p { margin: 0 0 4px; font-size: 11px; color: #555; line-height: 1.5; }
                    .footer { text-align: center; border-top: 1.5px solid #14a058; padding-top: 8px; margin-top: 10mm; }
                    .footer p { margin: 0 0 4px; font-size: 11px; color: #828282; }
                </style>
            </head><body>
            <div class="page-container">
                <div class="top-accent"></div>
                <div class="header">
                    <img src="${LOGO_JEC_URL}" alt="JEC" class="logo-img" onerror="this.style.display='none'"/>
                    <div>
                        <div class="invoice-title">INVOICE</div>
                        <div class="invoice-meta">No. Invoice: ${selectedDetail.no_invoice}<br>Dicetak: ${new Date().toLocaleDateString('id-ID')}</div>
                    </div>
                </div>
                <hr class="divider"/>
                <div class="info-section">
                    <div class="info-block">
                        <div class="info-label">Informasi Pasien</div>
                        <div class="info-value-main">${selectedDetail.nama_pasien || '-'}</div>
                        <div class="info-value-sub">User: ${selectedDetail.user_name || '-'}</div>
                        <div class="info-value-sub">WA: ${selectedDetail.nomor_wa || '-'}</div>
                        ${selectedDetail.user_email ? `<div class="info-value-sub">${selectedDetail.user_email}</div>` : ''}
                    </div>
                    <div class="info-block">
                        <div class="info-label">Lokasi &amp; Dokter</div>
                        <div class="info-value-main">${selectedDetail.fasilitas_name || '-'}</div>
                        <div class="info-value-sub">${selectedDetail.nama_dokter || '-'}</div>
                        <div class="info-value-sub">${selectedDetail.dokter_spesialis || 'Dokter Spesialis Mata'}</div>
                    </div>
                </div>
                <table>
                    <thead><tr><th>Layanan</th><th>Dokter</th><th>Jadwal</th><th>Status</th></tr></thead>
                    <tbody>
                        <tr>
                            <td><strong>Booking FLACS</strong><span class="sub">${selectedDetail.fasilitas_name || ''}</span></td>
                            <td><strong>${selectedDetail.nama_dokter || '-'}</strong><span class="sub">${selectedDetail.dokter_spesialis || ''}</span></td>
                            <td>${tgl}</td>
                            <td><span class="status-badge ${getStatusClass(selectedDetail.status)}">${(selectedDetail.status || 'Pending').toUpperCase()}</span></td>
                        </tr>
                    </tbody>
                </table>
                <div class="notes-box">
                    <p>• Harap tiba 30 menit sebelum jadwal untuk proses administrasi.</p>
                    <p>• Bawa KTP/SIM dan dokumen ini sebagai bukti booking.</p>
                    <p>• Hubungi Call Center 0804-122-1000 apabila ada perubahan jadwal.</p>
                </div>
                <div class="footer">
                    <p>JEC Eye Hospitals &amp; Clinics | www.jec.co.id | Call Center: 0804-122-1000</p>
                    <p style="color:#aaa; font-size:10px;">Dokumen ini dicetak otomatis dan sah tanpa tanda tangan fisik.</p>
                </div>
            </div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    // ── FILTER ────────────────────────────────────────────────────────────────
    const jumlahPending = bookings.filter(b =>
        ['pending', 'menunggu'].includes((b.status || '').toLowerCase())
    ).length;

    const filteredBookings = bookings.filter(item => {
        const q = searchQuery.toLowerCase();
        const matchQ = (item.no_invoice || '').toLowerCase().includes(q)
            || (item.user_name || '').toLowerCase().includes(q)
            || (item.nama_pasien || '').toLowerCase().includes(q);
        const matchStatus = filterStatus === 'Semua' || getStatusLabel(item.status) === filterStatus;
        return matchQ && matchStatus;
    });

    return (
        <div className="crud-page">
            <style>{sharedStyles}</style>

            {/* ── HEADER ── */}
            <div className="crud-page-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0 }}>Booking FLACS</h1>
                
                {/* ── BUNGKUS KHUSUS UNTUK MENDEKATKAN BADGE KUNING & NOTIFIKASI TOAST ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    
                    {/* Badge Kuning */}
                    {jumlahPending > 0 && (
                        <span style={{
                            backgroundColor: '#ffc107', color: '#856404',
                            border: '1px solid #ffc107', borderRadius: '20px',
                            padding: '4px 12px', fontSize: '0.8rem', fontWeight: '700',
                            display: 'flex', alignItems: 'center', gap: '5px',
                            animation: 'pulse 1.5s ease-in-out infinite',
                            boxShadow: '0 0 0 0 rgba(255,193,7,0.4)',
                        }}>
                            🔔 {jumlahPending} Menunggu Konfirmasi
                        </span>
                    )}
                    
                    {/* Notifikasi Toast Inline */}
                    {toastNotif && (
                        <div className="flacs-notif-inline">
                            <div className="flacs-toast-icon">🏥</div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#14a058' }}>{toastNotif.title}</h4>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>{toastNotif.desc}</p>
                            </div>
                            <button className="flacs-toast-close" onClick={() => setToastNotif(null)}>&times;</button>
                        </div>
                    )}

                </div>
                {/* ── SELESAI BUNGKUS KHUSUS ── */}

            </div>

            {/* ── FILTER BAR ── */}
            <div className="bk-filter-bar">
                {['Semua', 'Menunggu', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'].map(s => (
                    <button
                        key={s}
                        className={`bk-filter-chip${filterStatus === s ? ' active' : ''}`}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s}
                    </button>
                ))}
                <input
                    type="text"
                    className="bk-search-input"
                    placeholder="Cari invoice, nama user..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                <button
                    className="bk-excel-btn"
                    onClick={handleExportExcel}
                    disabled={isExporting || filteredBookings.length === 0}
                >
                    <ExcelIcon />
                    {isExporting ? 'Mengekspor...' : 'Export Excel'}
                </button>
            </div>

            {/* ── CONTENT ── */}
            {loading ? (
                <div className="bk-loading">
                    <div className="bk-spinner" />
                    <p>Memuat data booking...</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bk-empty">
                    <div className="bk-empty-icon">📋</div>
                    <p>Tidak ada data booking FLACS.</p>
                </div>
            ) : (
                <div className="bk-grid">
                    {filteredBookings.map(item => (
                        <div
                            key={item.id}
                            className={`bk-card${['pending','menunggu'].includes((item.status||'').toLowerCase()) ? ' new-booking-highlight' : ''}`}
                            onClick={() => openDetail(item)}
                        >
                            <div className="bk-card-invoice-bar">
                                <span className="bk-card-invoice-label">Invoice</span>
                                <span className="bk-card-invoice-no">{item.no_invoice}</span>
                            </div>

                            <div className="bk-card-body">
                                <img
                                    className="bk-card-avatar"
                                    src={getImageUrl(item.user_image, 'user') || fallbackAvatar}
                                    alt={item.user_name}
                                    onError={e => { e.target.src = fallbackAvatar; }}
                                />
                                <p className="bk-card-user-name">{item.user_name || 'Guest'}</p>
                                <p className="bk-card-pasien">Pasien: {item.nama_pasien}</p>
                                <div className="bk-card-date">
                                    <CalendarIcon />
                                    {new Date(item.tgl_kedatangan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            </div>

                            <div className="bk-card-footer" onClick={e => e.stopPropagation()}>
                                <span className={`bk-status-chip ${getStatusClass(item.status)}`}>
                                    {getStatusLabel(item.status)}
                                </span>
                                <button
                                    className="bk-card-delete-btn"
                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.id); }}
                                >
                                    🗑️ Hapus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── DETAIL MODAL ── */}
            {showDetailModal && selectedDetail && (
                <div className="flacs-overlay" onClick={closeDetail}>
                    <div className="flacs-modal" onClick={e => e.stopPropagation()}>

                        <div className="fm-hero">
                            <div className="fm-hero-top">
                                <div>
                                    <span className="fm-hero-badge">Booking FLACS</span>
                                    <div className="fm-hero-invoice">{selectedDetail.no_invoice}</div>
                                </div>
                                <button className="fm-close-btn" onClick={closeDetail}>×</button>
                            </div>
                        </div>

                        <div className="fm-body">
                            <div className="fm-user-card">
                                <img className="fm-avatar"
                                    src={getImageUrl(selectedDetail.user_image, 'user') || fallbackAvatar}
                                    alt="User" onError={e => { e.target.src = fallbackAvatar; }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="fm-user-name">{selectedDetail.user_name || 'Tidak ada nama'}</p>
                                    <p className="fm-user-email">{selectedDetail.user_email || 'Tidak ada email'}</p>
                                    <p className="fm-user-loc">
                                        {selectedDetail.province_name
                                            ? `${selectedDetail.district_name}, ${selectedDetail.city_name}, ${selectedDetail.province_name}`
                                            : 'Alamat tidak tersedia'}
                                    </p>
                                </div>
                                <div className="fm-status-select-wrap">
                                    <select
                                        className={`fm-status-select ${getStatusClass(selectedDetail.status)}`}
                                        value={selectedDetail.status || 'pending'}
                                        onChange={e => handleStatusChange(selectedDetail.id, e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="selesai">Selesai</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>

                            <div className="fm-grid">
                                <div className="fm-card">
                                    <div className="fm-card-title">Pasien &amp; Reservasi</div>
                                    <div className="fm-field">
                                        <div className="fm-label">Nama Pasien</div>
                                        <p className="fm-value">{selectedDetail.nama_pasien || '-'}</p>
                                    </div>
                                    <div className="fm-field">
                                        <div className="fm-label">Nomor WhatsApp</div>
                                        <p className="fm-value phone">{selectedDetail.nomor_wa || '-'}</p>
                                    </div>
                                    <div className="fm-field">
                                        <div className="fm-label">Tanggal Kedatangan</div>
                                        <div className="fm-date-chip">
                                            <CalendarIcon />
                                            {new Date(selectedDetail.tgl_kedatangan).toLocaleDateString('id-ID', {
                                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="fm-card">
                                    <div className="fm-card-title">Tujuan Layanan</div>
                                    <div className="fm-entity-row">
                                        <img className="fm-entity-img"
                                            src={getImageUrl(selectedDetail.fasilitas_image) || fallbackBuilding}
                                            alt="Fasilitas" onError={e => { e.target.src = fallbackBuilding; }} />
                                        <div>
                                            <p className="fm-entity-name">{selectedDetail.fasilitas_name || '-'}</p>
                                            <p className="fm-entity-sub">{selectedDetail.fasilitas_type || 'Fasilitas'}</p>
                                        </div>
                                        {selectedDetail.fasilitas_type && (
                                            <span className="fm-entity-type">{selectedDetail.fasilitas_type}</span>
                                        )}
                                    </div>
                                    <div className="fm-entity-row">
                                        <img className="fm-entity-img round"
                                            src={getImageUrl(selectedDetail.dokter_foto) || fallbackAvatar}
                                            alt="Dokter" onError={e => { e.target.src = fallbackAvatar; }} />
                                        <div>
                                            <p className="fm-entity-name">{selectedDetail.nama_dokter || '-'}</p>
                                            <p className="fm-entity-sub">{selectedDetail.dokter_spesialis || 'Dokter Spesialis'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="fm-footer">
                            <button className="fm-btn fm-btn-ghost" onClick={closeDetail}>Kembali</button>
                            <button className="fm-btn fm-btn-print" onClick={handlePrint}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                Print
                            </button>
                            <button className="fm-btn fm-btn-pdf" onClick={handleDownloadPDF} disabled={isPdfLoading}>
                                {isPdfLoading
                                    ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'bk-spin .7s linear infinite'}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Memproses...</>
                                    : <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Cetak PDF</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CONFIRM DELETE MODAL ── */}
            {confirmDelete && (
                <div className="bk-confirm-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="bk-confirm-box" onClick={e => e.stopPropagation()}>
                        <div className="bk-confirm-icon">🗑️</div>
                        <p className="bk-confirm-title">Hapus Booking?</p>
                        <p className="bk-confirm-desc">Data booking ini akan dihapus permanen dan tidak bisa dikembalikan.</p>
                        <div className="bk-confirm-actions">
                            <button className="bk-confirm-cancel" onClick={() => setConfirmDelete(null)}>Batal</button>
                            <button className="bk-confirm-del" onClick={handleDelete}>Ya, Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="bk-toast">{toast}</div>}
        </div>
    );
};

export default Flacs;