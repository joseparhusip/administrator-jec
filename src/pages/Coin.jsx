import React, { useState, useEffect } from 'react';
import '../css/style.css';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/admin/coin`;
const BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL;

const TIER_CONFIG = {
  Bronze:   { emoji: '🥉', color: '#CD7F32', bg: 'linear-gradient(135deg, #fdf3e7 0%, #fce8cc 100%)', border: '#CD7F32', textColor: '#7a4a1a', range: '0 – 499 Poin' },
  Silver:   { emoji: '🥈', color: '#9E9E9E', bg: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)', border: '#9E9E9E', textColor: '#555555', range: '500 – 999 Poin' },
  Gold:     { emoji: '🥇', color: '#FFD700', bg: 'linear-gradient(135deg, #fffde7 0%, #fff3b0 100%)', border: '#FFD700', textColor: '#7a6000', range: '1000 – 1999 Poin' },
  Platinum: { emoji: '💎', color: '#5B8DEF', bg: 'linear-gradient(135deg, #e8f0fe 0%, #cddcfc 100%)', border: '#5B8DEF', textColor: '#1a3a8a', range: '2000 – 4999 Poin' },
  Diamond:  { emoji: '💠', color: '#00BCD4', bg: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%)', border: '#00BCD4', textColor: '#006064', range: '5000+ Poin' },
};

const TIERS = Object.keys(TIER_CONFIG);

const getAvatarUrl = (profileImage, userName) => {
  if (!profileImage) return DEFAULT_AVATAR(userName);
  const normalized = profileImage.replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
  const idx = normalized.indexOf('assets/');
  const relativePath = idx !== -1 ? normalized.substring(idx) : normalized;
  return `${BASE_URL}/${relativePath}`;
};

const DEFAULT_AVATAR = (name) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=random&color=fff&bold=true&size=128`;
};

const ExcelIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 13H16M8 17H16M10 9H14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function Coin() {
  const [userPoints, setUserPoints] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ points: 0, current_tier: 'Bronze' });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const fetchUserPoints = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL);
      if (response.data.success) setUserPoints(response.data.data);
      else setToastMessage('Gagal mengambil data dari server.');
    } catch (error) {
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUserPoints(); }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleOpenEditModal = (user, e) => {
    e.stopPropagation();
    setSelectedUser(user);
    setEditFormData({ points: user.points, current_tier: user.current_tier });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => { setIsEditModalOpen(false); };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_URL}/${selectedUser.user_id}`, {
        points: editFormData.points,
        current_tier: editFormData.current_tier,
      });
      if (response.data.success) {
        setToastMessage('Poin & tier user berhasil diperbarui.');
        fetchUserPoints();
        handleCloseEditModal();
        setIsDetailModalOpen(false);
      } else {
        setToastMessage('Gagal memperbarui data.');
      }
    } catch (error) {
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleOpenConfirmModal = (user, e) => {
    e.stopPropagation();
    setItemToDelete(user);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const response = await axios.delete(`${API_URL}/${itemToDelete.user_id}`);
      if (response.data.success) {
        setToastMessage('Data poin user berhasil dihapus.');
        fetchUserPoints();
        setIsConfirmModalOpen(false);
        setIsDetailModalOpen(false);
        setItemToDelete(null);
      } else {
        setToastMessage('Gagal menghapus data.');
      }
    } catch (error) {
      setToastMessage(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleOpenDetailModal = (user) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  // ── EXPORT EXCEL ──────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (filteredUsers.length === 0) { setToastMessage('Tidak ada data untuk diekspor.'); return; }
    setIsExporting(true);
    try {
      const rows = filteredUsers.map((u, idx) => ({
        'No': idx + 1,
        'User ID': u.user_id,
        'Nama User': u.user_name || '-',
        'Total Poin': u.points,
        'Tier': u.current_tier || '-',
        'Rentang Tier': TIER_CONFIG[u.current_tier]?.range || '-',
        'Terakhir Update': new Date(u.updated_at).toLocaleString('id-ID'),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 5 }, { wch: 10 }, { wch: 24 },
        { wch: 14 }, { wch: 12 }, { wch: 22 }, { wch: 22 },
      ];

      // Ringkasan per tier
      const tierSummary = TIERS.map(tier => ({
        'Tier': `${TIER_CONFIG[tier].emoji} ${tier}`,
        'Rentang Poin': TIER_CONFIG[tier].range,
        'Jumlah User': userPoints.filter(u => u.current_tier === tier).length,
        'Total Poin Tier': userPoints.filter(u => u.current_tier === tier).reduce((a, u) => a + u.points, 0),
      }));
      const wsRing = XLSX.utils.json_to_sheet(tierSummary);
      wsRing['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 14 }, { wch: 18 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Poin User');
      XLSX.utils.book_append_sheet(wb, wsRing, 'Ringkasan Tier');
      XLSX.writeFile(wb, `Poin_Tier_User_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setToastMessage('Data berhasil diekspor ke Excel!');
    } catch (err) {
      setToastMessage('Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredUsers = userPoints.filter(u => {
    const matchSearch = u.user_name && u.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTier = filterTier === 'Semua' || u.current_tier === filterTier;
    return matchSearch && matchTier;
  });

  return (
    <div className="crud-page">
      {/* ── Header ── */}
      <div className="crud-page-header">
        <h1>Manajemen Poin & Tier Pengguna</h1>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari nama user..."
            className="search-input"
            style={{ margin: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-dropdown"
            style={{ margin: 0, whiteSpace: 'nowrap' }}
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
          >
            <option value="Semua">Semua Tier</option>
            {TIERS.map(t => <option key={t} value={t}>{TIER_CONFIG[t].emoji} {t}</option>)}
          </select>

          {/* ── Tombol Export Excel ── */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting || isLoading || filteredUsers.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px',
              backgroundColor: '#1D6F42',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '0.855rem', fontWeight: '700', cursor: 'pointer',
              opacity: (isExporting || isLoading || filteredUsers.length === 0) ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(29,111,66,0.28)',
              transition: 'background-color 0.2s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!isExporting) { e.currentTarget.style.backgroundColor = '#155534'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1D6F42'; e.currentTarget.style.transform = 'translateY(0)'; }}
            title="Export data poin & tier ke Excel"
          >
            <ExcelIcon />
            {isExporting ? 'Mengekspor...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* ── Summary Bar ── */}
      <div className="users-summary-bar">
        <span className="users-count-label">
          Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{userPoints.length}</strong> pengguna
        </span>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {TIERS.map(tier => {
            const count = userPoints.filter(u => u.current_tier === tier).length;
            if (count === 0) return null;
            const cfg = TIER_CONFIG[tier];
            return (
              <span key={tier} style={{
                fontSize: '0.78rem', fontWeight: 600,
                padding: '3px 10px', borderRadius: '20px',
                background: cfg.bg, color: cfg.textColor,
                border: `1px solid ${cfg.border}44`,
                cursor: 'pointer',
              }} onClick={() => setFilterTier(filterTier === tier ? 'Semua' : tier)}>
                {cfg.emoji} {tier} ({count})
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Card Grid ── */}
      {isLoading ? (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat data pengguna...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-icon">🪙</div>
          <p>Tidak ada pengguna ditemukan</p>
        </div>
      ) : (
        <div className="rs-card-grid">
          {filteredUsers.map(user => {
            const cfg = TIER_CONFIG[user.current_tier] || TIER_CONFIG.Bronze;
            return (
              <div
                key={user.user_id}
                className="coin-user-card"
                onClick={() => handleOpenDetailModal(user)}
                style={{ '--tier-color': cfg.color, '--tier-bg': cfg.bg, '--tier-border': cfg.border }}
              >
                <div className="coin-card-tier-badge" style={{ background: cfg.bg, color: cfg.textColor, border: `1.5px solid ${cfg.border}55` }}>
                  {cfg.emoji} {user.current_tier}
                </div>

                <div className="coin-card-avatar-wrap">
                  <img
                    src={getAvatarUrl(user.profile_image, user.user_name)}
                    alt={user.user_name}
                    className="coin-card-avatar"
                    onError={(e) => { e.target.src = DEFAULT_AVATAR(user.user_name); }}
                  />
                </div>

                <div className="coin-card-points-badge" style={{ background: cfg.color }}>
                  🪙 {user.points.toLocaleString('id-ID')}
                </div>

                <div className="coin-card-body">
                  <h3 className="coin-card-name">{user.user_name}</h3>
                  <p className="coin-card-id">ID #{user.user_id}</p>
                  <p className="coin-card-updated">
                    Update: {new Date(user.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                <div className="coin-card-footer" onClick={e => e.stopPropagation()}>
                  <button className="btn-edit coin-card-btn" onClick={(e) => handleOpenEditModal(user, e)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-delete coin-card-btn" onClick={(e) => handleOpenConfirmModal(user, e)}>
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL DETAIL ── */}
      {isDetailModalOpen && selectedUser && (() => {
        const cfg = TIER_CONFIG[selectedUser.current_tier] || TIER_CONFIG.Bronze;
        return (
          <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
            <div className="modal-content coin-detail-modal" onClick={e => e.stopPropagation()}>
              <div className="coin-detail-hero" style={{ background: cfg.bg }}>
                <img
                  src={getAvatarUrl(selectedUser.profile_image, selectedUser.user_name)}
                  alt={selectedUser.user_name}
                  className="coin-detail-avatar"
                  onError={(e) => { e.target.src = DEFAULT_AVATAR(selectedUser.user_name); }}
                />
                <div>
                  <h2 style={{ margin: 0, color: cfg.textColor }}>{selectedUser.user_name}</h2>
                  <p style={{ margin: '4px 0 0', color: cfg.textColor, opacity: 0.7, fontSize: '0.9rem' }}>User ID #{selectedUser.user_id}</p>
                </div>
              </div>

              <div className="coin-detail-stats">
                <div className="coin-detail-stat-item" style={{ background: cfg.bg, borderColor: `${cfg.border}44` }}>
                  <span className="coin-stat-icon">🪙</span>
                  <span className="coin-stat-value" style={{ color: cfg.textColor }}>{selectedUser.points.toLocaleString('id-ID')}</span>
                  <span className="coin-stat-label">Total Poin</span>
                </div>
                <div className="coin-detail-stat-item" style={{ background: cfg.bg, borderColor: `${cfg.border}44` }}>
                  <span className="coin-stat-icon">{cfg.emoji}</span>
                  <span className="coin-stat-value" style={{ color: cfg.textColor }}>{selectedUser.current_tier}</span>
                  <span className="coin-stat-label">Tier Saat Ini</span>
                </div>
                <div className="coin-detail-stat-item" style={{ background: '#f9f9f9', borderColor: '#eee' }}>
                  <span className="coin-stat-icon">📅</span>
                  <span className="coin-stat-value" style={{ color: '#444', fontSize: '0.85rem' }}>
                    {new Date(selectedUser.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="coin-stat-label">Terakhir Update</span>
                </div>
              </div>

              <div className="coin-detail-range" style={{ borderLeft: `3px solid ${cfg.color}` }}>
                <small style={{ color: '#888' }}>Rentang poin tier <strong style={{ color: cfg.textColor }}>{selectedUser.current_tier}</strong>:</small>
                <span style={{ color: cfg.textColor, fontWeight: 600, marginLeft: 8 }}>{cfg.range}</span>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Tutup</button>
                <button className="btn-edit" onClick={(e) => { setIsDetailModalOpen(false); handleOpenEditModal(selectedUser, e); }}>✏️ Edit Poin & Tier</button>
                <button className="btn-danger" onClick={(e) => { setIsDetailModalOpen(false); handleOpenConfirmModal(selectedUser, e); }}>🗑️ Hapus</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL EDIT ── */}
      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Poin & Tier: {selectedUser.user_name}</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>User ID</label>
                  <input type="text" value={selectedUser.user_id} disabled />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-points">Total Poin</label>
                  <input
                    type="number" id="edit-points" name="points"
                    value={editFormData.points}
                    onChange={e => setEditFormData(p => ({ ...p, points: parseInt(e.target.value) || 0 }))}
                    required min="0"
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-tier">Tier</label>
                  <select
                    id="edit-tier" name="current_tier"
                    value={editFormData.current_tier}
                    onChange={e => setEditFormData(p => ({ ...p, current_tier: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #ddd', fontSize: '0.95rem', outline: 'none' }}
                  >
                    {TIERS.map(t => (
                      <option key={t} value={t}>{TIER_CONFIG[t].emoji} {t} ({TIER_CONFIG[t].range})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseEditModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL HAPUS ── */}
      {isConfirmModalOpen && (
        <div className="modal-overlay confirmation-modal" onClick={() => { setIsConfirmModalOpen(false); setItemToDelete(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => { setIsConfirmModalOpen(false); setItemToDelete(null); }}>×</button>
            <div className="modal-body">
              <div className="modal-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="modal-body-content">
                <h2>Konfirmasi Hapus</h2>
                <p>
                  Hapus data poin untuk user: <strong>{itemToDelete?.user_name}</strong>?
                  <br />
                  <small style={{ color: 'red' }}>Ini juga akan menghapus riwayat klaim harian user.</small>
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => { setIsConfirmModalOpen(false); setItemToDelete(null); }}>Batal</button>
              <button className="btn-danger" onClick={handleDeleteConfirm}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div className="toast-notification">{toastMessage}</div>}
    </div>
  );
}

export default Coin;