import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  .bk-card-avatar-wrap { position: relative; }
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
`;

const Lasik = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState('');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const fetchBookings = async () => {
        try {
            const response = await api.get('/admin/layanan/lasik');
            if (response.data.success) setBookings(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil data lasik:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.put(`/admin/layanan/lasik/${id}/status`, { status: newStatus });
            setBookings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
            if (selectedDetail && selectedDetail.id === id) {
                setSelectedDetail(prev => ({ ...prev, status: newStatus }));
            }
            showToast(`Status diubah → ${newStatus}`);
        } catch { showToast("Gagal mengubah status."); }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await api.delete(`/admin/layanan/lasik/${confirmDelete}`);
            setBookings(prev => prev.filter(item => item.id !== confirmDelete));
            if (selectedDetail && selectedDetail.id === confirmDelete) {
                setShowDetailModal(false); setSelectedDetail(null);
            }
            showToast("Data booking berhasil dihapus.");
        } catch { showToast("Gagal menghapus data."); }
        finally { setConfirmDelete(null); }
    };

    // ── EXPORT EXCEL ──────────────────────────────────────────────────
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
                { 'Keterangan': 'Total Booking LASIK', 'Nilai': bookings.length },
                { 'Keterangan': 'Dikonfirmasi', 'Nilai': statusCount('Dikonfirmasi') },
                { 'Keterangan': 'Menunggu (Pending)', 'Nilai': statusCount('Menunggu') },
                { 'Keterangan': 'Selesai', 'Nilai': statusCount('Selesai') },
                { 'Keterangan': 'Dibatalkan', 'Nilai': statusCount('Dibatalkan') },
                { 'Keterangan': 'Diekspor Pada', 'Nilai': new Date().toLocaleString('id-ID') },
            ];
            const wsRing = XLSX.utils.json_to_sheet(ringkasan);
            wsRing['!cols'] = [{ wch: 28 }, { wch: 20 }];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Booking LASIK');
            XLSX.utils.book_append_sheet(wb, wsRing, 'Ringkasan');
            XLSX.writeFile(wb, `Booking_LASIK_${new Date().toISOString().slice(0, 10)}.xlsx`);
            showToast('Data berhasil diekspor ke Excel!');
        } catch (err) {
            showToast('Gagal mengekspor data.');
        } finally {
            setIsExporting(false);
        }
    };

    const getStatusClass = (status) => {
        const s = status ? status.toLowerCase() : '';
        if (['dikonfirmasi', 'selesai', 'confirmed'].includes(s)) return 'success';
        if (['pending', 'menunggu'].includes(s)) return 'warning';
        if (['batal', 'cancelled', 'ditolak'].includes(s)) return 'danger';
        return 'secondary';
    };

    const getStatusLabel = (status) => {
        const s = status ? status.toLowerCase() : '';
        if (['confirmed', 'dikonfirmasi'].includes(s)) return 'Dikonfirmasi';
        if (s === 'selesai') return 'Selesai';
        if (['pending', 'menunggu'].includes(s)) return 'Menunggu';
        if (['batal', 'cancelled', 'ditolak'].includes(s)) return 'Dibatalkan';
        return status || 'Pending';
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

    const handleDownloadPDF = () => {
        if (!selectedDetail) return;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.setFillColor(34, 153, 84);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('INVOICE BOOKING LASIK', 15, 15);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        doc.text('JEC Eye Hospitals & Clinics', 15, 22);
        doc.setTextColor(40, 40, 40); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text(`No. Invoice: ${selectedDetail.no_invoice}`, 15, 40);
        autoTable(doc, {
            startY: 45,
            head: [['Kategori', 'Detail Informasi']],
            body: [
                ['Nama Pasien', selectedDetail.nama_pasien],
                ['Nomor WhatsApp', selectedDetail.nomor_wa],
                ['Tanggal Kedatangan', new Date(selectedDetail.tgl_kedatangan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
                ['Fasilitas / Klinik', selectedDetail.fasilitas_name || '-'],
                ['Dokter Tujuan', selectedDetail.nama_dokter || '-'],
                ['Spesialisasi', selectedDetail.dokter_spesialis || '-'],
                ['Status', selectedDetail.status ? selectedDetail.status.toUpperCase() : 'PENDING'],
            ],
            headStyles: { fillColor: [34, 153, 84] },
            alternateRowStyles: { fillColor: [247, 252, 249] },
            theme: 'grid'
        });
        doc.save(`Booking-LASIK-${selectedDetail.no_invoice}.pdf`);
    };

    const handlePrint = () => {
        if (!selectedDetail) return;
        const tgl = new Date(selectedDetail.tgl_kedatangan).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const printWindow = window.open('', '', 'height=700,width=800');
        printWindow.document.write(`<html><head><title>Cetak Booking - ${selectedDetail.no_invoice}</title>
            <style>body{font-family:Arial,sans-serif;color:#333;padding:20px;}.header{background:#14a058;color:#fff;padding:20px;border-radius:8px 8px 0 0;}.content{border:1px solid #ddd;padding:30px;border-radius:0 0 8px 8px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{padding:12px;text-align:left;border-bottom:1px solid #eee;}th{background:#f4fcf6;color:#14a058;width:30%;}.badge{display:inline-block;padding:5px 10px;background:#14a058;color:#fff;border-radius:4px;font-weight:bold;}</style></head>
            <body><div class="header"><h1 style="margin:0">BUKTI BOOKING LASIK</h1><p style="margin:5px 0 0">JEC Eye Hospitals & Clinics</p></div>
            <div class="content"><h2 style="color:#14a058">Invoice: ${selectedDetail.no_invoice}</h2>
            <table><tr><th>Nama Pasien</th><td>${selectedDetail.nama_pasien}</td></tr>
            <tr><th>Nomor WA</th><td>${selectedDetail.nomor_wa}</td></tr>
            <tr><th>Tanggal Kedatangan</th><td><strong>${tgl}</strong></td></tr>
            <tr><th>Fasilitas</th><td>${selectedDetail.fasilitas_name || '-'}</td></tr>
            <tr><th>Dokter Tujuan</th><td>${selectedDetail.nama_dokter || '-'} (${selectedDetail.dokter_spesialis || '-'})</td></tr>
            <tr><th>Status</th><td><span class="badge">${selectedDetail.status ? selectedDetail.status.toUpperCase() : 'PENDING'}</span></td></tr></table>
            <p style="text-align:center;margin-top:40px;font-size:.9em;color:#777">Dicetak otomatis pada ${new Date().toLocaleString('id-ID')}</p></div></body></html>`);
        printWindow.document.close(); printWindow.focus();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    const statusOptions = ['Semua', 'Pending', 'Dikonfirmasi', 'Selesai', 'Batal'];

    const filteredBookings = bookings.filter(item => {
        const matchStatus = filterStatus === 'Semua' || getStatusLabel(item.status).toLowerCase() === filterStatus.toLowerCase() || (item.status || '').toLowerCase() === filterStatus.toLowerCase();
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || (item.no_invoice || '').toLowerCase().includes(q) || (item.user_name || '').toLowerCase().includes(q) || (item.nama_pasien || '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    return (
        <div className="crud-page crud-container">
            <style>{sharedStyles}</style>

            <div className="crud-page-header">
                <h1>Booking Layanan LASIK</h1>
            </div>

            {/* Filter, Search & Export Excel */}
            <div className="bk-filter-bar">
                {statusOptions.map(s => (
                    <button
                        key={s}
                        className={`bk-filter-chip ${filterStatus === s ? 'active' : ''}`}
                        onClick={() => setFilterStatus(s)}
                    >{s}</button>
                ))}
                <input
                    className="bk-search-input"
                    placeholder="🔍 Cari invoice / nama..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {/* ── Tombol Export Excel ── */}
                <button
                    className="bk-excel-btn"
                    onClick={handleExportExcel}
                    disabled={isExporting || loading || filteredBookings.length === 0}
                    title="Export data booking LASIK ke Excel"
                >
                    <ExcelIcon />
                    {isExporting ? 'Mengekspor...' : 'Export Excel'}
                </button>
            </div>

            {/* Summary */}
            <div className="users-summary-bar" style={{ marginBottom: '1rem' }}>
                <span className="users-count-label">
                    Menampilkan <strong>{filteredBookings.length}</strong> dari <strong>{bookings.length}</strong> booking
                </span>
            </div>

            {/* Card Grid */}
            {loading ? (
                <div className="bk-loading">
                    <div className="bk-spinner" />
                    <p>Memuat data booking LASIK...</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bk-empty">
                    <div className="bk-empty-icon">👁️</div>
                    <p>Belum ada data booking LASIK.</p>
                </div>
            ) : (
                <div className="bk-grid">
                    {filteredBookings.map(item => (
                        <div className="bk-card" key={item.id} onClick={() => openDetail(item)}>
                            <div className="bk-card-invoice-bar">
                                <span className="bk-card-invoice-label">Invoice</span>
                                <span className="bk-card-invoice-no">{item.no_invoice}</span>
                            </div>

                            <div className="bk-card-body">
                                <div className="bk-card-avatar-wrap">
                                    <img
                                        className="bk-card-avatar"
                                        src={getImageUrl(item.user_image, 'user') || fallbackAvatar}
                                        alt={item.user_name}
                                        onError={e => { e.target.src = fallbackAvatar; }}
                                    />
                                </div>
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
                                    <span className="fm-hero-badge">Booking LASIK</span>
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
                                        value={selectedDetail.status || 'Pending'}
                                        onChange={e => handleStatusChange(selectedDetail.id, e.target.value)}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Dikonfirmasi">Dikonfirmasi</option>
                                        <option value="Selesai">Selesai</option>
                                        <option value="Batal">Batal</option>
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
                            <button className="fm-btn fm-btn-pdf" onClick={handleDownloadPDF}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Cetak PDF
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

export default Lasik;