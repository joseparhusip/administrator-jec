import React, { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import '../css/style.css';

// ✅ API URL dihandle axiosInstance
const IMG_URL = import.meta.env.VITE_IMAGE_BASE_URL;
const TOKEN = localStorage.getItem('adminToken');
const authHeaders = { headers: { 'Authorization': `Bearer ${TOKEN}` } };

// ── Inject CSS Asuransi (semua class yang dibutuhkan) ────────────
if (!document.getElementById('asuransi-page-styles')) {
  const style = document.createElement('style');
  style.id = 'asuransi-page-styles';
  style.textContent = `

    /* ══ GALLERY HEADER ══════════════════════════════════════════ */
    .asuransi-gallery-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.1rem 1.4rem;
      background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%);
      border-radius: 14px;
      margin-bottom: 1.25rem;
      box-shadow: 0 4px 18px rgba(46,125,50,0.22);
    }

    .asuransi-gallery-header-img {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      object-fit: cover;
      border: 2px solid rgba(255,255,255,0.4);
      flex-shrink: 0;
      background: rgba(255,255,255,0.1);
    }

    .asuransi-gallery-header-placeholder {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      flex-shrink: 0;
    }

    .asuransi-gallery-header-info {
      flex: 1;
      min-width: 0;
    }

    .asuransi-gallery-header-info h2 {
      color: #fff;
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0 0 0.2rem;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .asuransi-gallery-header-info p {
      color: rgba(255,255,255,0.78);
      font-size: 0.78rem;
      margin: 0;
    }

    /* ══ CUSTOM MODERN DROPDOWN ══════════════════════════════════ */
    .custom-dropdown-wrapper {
      position: relative;
      display: inline-block;
      min-width: 220px;
    }

    .custom-dropdown-wrapper::after {
      content: '▼';
      position: absolute;
      top: 50%;
      right: 14px;
      transform: translateY(-50%);
      font-size: 0.75rem;
      color: #64748B;
      pointer-events: none;
      transition: transform 0.2s ease;
    }

    .modern-filter-dropdown {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      width: 100%;
      padding: 10px 38px 10px 16px;
      font-size: 0.95rem;
      font-family: inherit;
      color: #334155;
      background-color: #ffffff;
      border: 1.5px solid #CBD5E1;
      border-radius: 10px;
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    .modern-filter-dropdown:hover {
      border-color: #A5D6A7;
      box-shadow: 0 4px 12px rgba(46, 125, 50, 0.08);
    }

    .modern-filter-dropdown:focus {
      border-color: #2E7D32;
      box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.15);
    }

    .modern-filter-dropdown option {
      font-weight: normal;
      color: #1e293b;
      padding: 10px;
    }

    /* ══ GRID ASURANSI CARD ══════════════════════════════════════ */
    .asuransi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1.1rem;
      padding-top: 0.25rem;
    }

    /* ══ ASURANSI CARD ═══════════════════════════════════════════ */
    .asuransi-card {
      background: #fff;
      border-radius: 14px;
      border: 1.5px solid #e9ecef;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

    .asuransi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 26px rgba(46,125,50,0.14);
      border-color: #A5D6A7;
    }

    /* Area logo — rasio tetap 3:2 */
    .asuransi-card-logo-wrap {
      width: 100%;
      aspect-ratio: 3 / 2;
      background: #f8fafb;
      border-bottom: 1px solid #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
      overflow: hidden;
    }

    .asuransi-card-logo {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
      transition: transform 0.25s ease;
    }

    .asuransi-card:hover .asuransi-card-logo {
      transform: scale(1.05);
    }

    .asuransi-card-logo-placeholder {
      font-size: 2.5rem;
      color: #adb5bd;
    }

    /* Nama asuransi */
    .asuransi-card-name {
      font-size: 0.82rem;
      font-weight: 600;
      color: #2d3748;
      text-align: center;
      padding: 10px 12px 6px;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.7em;
    }

    /* Tombol aksi Edit & Hapus */
    .asuransi-card-actions {
      display: flex;
      gap: 6px;
      padding: 8px 12px 12px;
      width: 100%;
    }

    .asuransi-card-btn-edit,
    .asuransi-card-btn-delete {
      flex: 1;
      padding: 6px 0;
      border-radius: 8px;
      font-size: 0.77rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, transform 0.12s;
    }

    .asuransi-card-btn-edit {
      background: #EEF3FD;
      color: #3B5FC0;
    }

    .asuransi-card-btn-edit:hover {
      background: #3B5FC0;
      color: #fff;
      transform: translateY(-1px);
    }

    .asuransi-card-btn-delete {
      background: #FEF2F2;
      color: #DC2626;
    }

    .asuransi-card-btn-delete:hover {
      background: #DC2626;
      color: #fff;
      transform: translateY(-1px);
    }

    /* ══ BADGE COUNT ════════════════════════════════════════════ */
    .asuransi-count-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #E8F5E9;
      color: #2E7D32;
      border: 1px solid #A5D6A7;
      border-radius: 20px;
      padding: 3px 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* ══ RESPONSIVE ════════════════════════════════════════════ */
    @media (max-width: 600px) {
      .asuransi-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.8rem;
      }
      .asuransi-gallery-header {
        flex-wrap: wrap;
      }
      .asuransi-gallery-header .add-button {
        width: 100%;
        justify-content: center;
      }
      .custom-dropdown-wrapper {
        width: 100%;
      }
    }

    @media (max-width: 380px) {
      .asuransi-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

// ── RS Selector Card ─────────────────────────────────────────────
function RsSelectorCard({ rs, onSelect }) {
  const imageUrl = rs.image ? `${IMG_URL}/${rs.image}` : null;
  const badgeClass = rs.type === 'Rumah Sakit' ? 'rs' : 'klinik';

  return (
    <div className="rs-card" onClick={() => onSelect(rs)}>
      <div className="rs-card-image-wrap">
        {imageUrl ? (
          <img src={imageUrl} alt={rs.title} className="rs-card-image" />
        ) : (
          <div className="rs-card-image-placeholder">🏥</div>
        )}
      </div>
      <div className="rs-card-body">
        <h3 className="rs-card-title">{rs.title}</h3>
        <p className="rs-card-location">{rs.location}</p>
        <span className={`rs-card-badge ${badgeClass}`}>{rs.type}</span>
      </div>
    </div>
  );
}

// ── Asuransi View (setelah RS dipilih) ───────────────────────────
function AsuransiView({ rs, onBack }) {
  const [asuransiList, setAsuransiList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', image: null });
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  useEffect(() => { fetchAsuransi(); }, [rs.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const fetchAsuransi = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/asuransi?fasilitas_id=${rs.id}`, authHeaders);
      if (res.data.success) setAsuransiList(res.data.data);
    } catch (err) {
      console.error('Gagal ambil asuransi:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateImageFile = (file) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { alert('Format gambar tidak didukung! Hanya JPG, PNG, dan WEBP.'); return false; }
    if (file.size > 500 * 1024) { alert(`Ukuran gambar terlalu besar! Maks 500KB. Ukuran Anda: ${(file.size / 1024).toFixed(0)}KB.`); return false; }
    return true;
  };

  const handleInputChange  = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange   = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateImageFile(file)) { e.target.value = ''; setFormData({ ...formData, image: null }); setNewImagePreview(null); return; }
    setFormData({ ...formData, image: file });
    setNewImagePreview(URL.createObjectURL(file));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ id: '', name: '', image: null });
    setPreviewImage('');
    setNewImagePreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setFormData({ id: item.id, name: item.name, image: null });
    setPreviewImage(item.image);
    setNewImagePreview(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('fasilitas_id', rs.id);
    if (formData.image) data.append('image', formData.image);
    try {
      if (isEditMode) {
        await api.put(`/admin/asuransi/${formData.id}`, data, authHeaders);
        setToastMessage('✅ Asuransi berhasil diupdate!');
      } else {
        await api.post('/admin/asuransi', data, authHeaders);
        setToastMessage('✅ Asuransi berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchAsuransi();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan data.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus asuransi ini?')) return;
    try {
      await api.delete(`/admin/asuransi/${id}`, authHeaders);
      setToastMessage('🗑️ Asuransi berhasil dihapus.');
      fetchAsuransi();
    } catch {
      alert('Gagal menghapus.');
    }
  };

  const imageUrl = rs.image ? `${IMG_URL}/${rs.image}` : null;

  return (
    <div className="crud-page">

      {/* ── Back Button ── */}
      <button className="frs-back-btn" onClick={onBack}>
        ← Kembali ke Daftar Fasilitas
      </button>

      {/* ── Header RS ── */}
      <div className="asuransi-gallery-header">
        {imageUrl ? (
          <img src={imageUrl} alt={rs.title} className="asuransi-gallery-header-img" />
        ) : (
          <div className="asuransi-gallery-header-placeholder">🏥</div>
        )}
        <div className="asuransi-gallery-header-info">
          <h2>{rs.title}</h2>
          <p>{rs.location} &nbsp;·&nbsp; {rs.type}</p>
        </div>
        <button className="add-button" onClick={openAddModal}>
          + Tambah Asuransi
        </button>
      </div>

      {/* ── Summary ── */}
      <div className="users-summary-bar" style={{ marginBottom: '1.1rem' }}>
        <span className="asuransi-count-badge">
          🛡️ {asuransiList.length} asuransi terdaftar
        </span>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat data asuransi...</p>
        </div>
      ) : asuransiList.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-icon">🛡️</div>
          <p>Belum ada asuransi untuk {rs.title}.</p>
          <small>Klik "+ Tambah Asuransi" untuk menambahkan.</small>
        </div>
      ) : (
        <div className="asuransi-grid">
          {asuransiList.map(item => (
            <div className="asuransi-card" key={item.id}>
              <div className="asuransi-card-logo-wrap">
                {item.image ? (
                  <img
                    src={`${IMG_URL}/${item.image}`}
                    alt={item.name}
                    className="asuransi-card-logo"
                  />
                ) : (
                  <div className="asuransi-card-logo-placeholder">🛡️</div>
                )}
              </div>
              <span className="asuransi-card-name">{item.name}</span>
              <div className="asuransi-card-actions">
                <button className="asuransi-card-btn-edit"   onClick={() => openEditModal(item)}>✏️ Edit</button>
                <button className="asuransi-card-btn-delete" onClick={() => handleDelete(item.id)}>🗑️ Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Tambah / Edit ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditMode ? '✏️ Edit Asuransi' : '+ Tambah Asuransi'}</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Nama RS (locked) */}
                <div className="modal-form-group">
                  <label>Nama Fasilitas</label>
                  <input
                    type="text"
                    value={rs.title}
                    disabled
                    style={{ background: '#f4f4f4', color: '#555', fontWeight: 600 }}
                  />
                </div>

                {/* Nama Asuransi */}
                <div className="modal-form-group">
                  <label>Nama Asuransi <span style={{ color: '#DC2626' }}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Contoh: BPJS Kesehatan"
                    required
                  />
                </div>

                {/* Logo */}
                <div className="modal-form-group">
                  <label>
                    Logo Asuransi
                    <span style={{ fontSize: '0.78rem', color: '#888', marginLeft: '6px' }}>
                      (JPG/PNG/WEBP, maks. 500KB)
                    </span>
                  </label>

                  {/* Preview logo lama saat edit */}
                  {previewImage && !newImagePreview && (
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>Logo saat ini:</p>
                      <img
                        src={`${IMG_URL}/${previewImage}`}
                        alt="Logo saat ini"
                        style={{ height: '64px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '4px', background: '#fafafa' }}
                      />
                    </div>
                  )}

                  <input
                    type="file"
                    name="image"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.webp"
                  />

                  {/* Preview logo baru */}
                  {newImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '6px' }}>Preview logo baru:</p>
                      <img
                        src={newImagePreview}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '10px', border: '1.5px solid #A5D6A7', background: '#f8fafb', padding: '8px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && <div className="toast-notification">{toastMessage}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
function Asuransi() {
  const [fasilitasList, setFasilitasList] = useState([]);
  const [filterType,    setFilterType]    = useState('Semua');
  const [loading,       setLoading]       = useState(true);
  const [selectedRs,    setSelectedRs]    = useState(null);

  useEffect(() => {
    const fetchFasilitas = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/fasilitas', authHeaders);
        if (res.data.success) setFasilitasList(res.data.data);
      } catch (err) {
        console.error('Gagal ambil fasilitas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFasilitas();
  }, []);

  if (selectedRs) {
    return <AsuransiView rs={selectedRs} onBack={() => setSelectedRs(null)} />;
  }

  const uniqueTypes  = ['Semua', ...new Set(fasilitasList.map(f => f.type).filter(Boolean))];
  const filteredList = fasilitasList.filter(rs => filterType === 'Semua' || rs.type === filterType);

  return (
    <div className="crud-page">
      <div className="crud-page-header">
        <h1>Manajemen Asuransi</h1>
        <div className="crud-header-controls">
          {/* Implementasi Dropdown Modern */}
          <div className="custom-dropdown-wrapper">
            <select
              className="modern-filter-dropdown"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {uniqueTypes.map((type, i) => (
                <option key={i} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="users-summary-bar">
        <span className="users-count-label">
          Menampilkan {filteredList.length} dari {fasilitasList.length} fasilitas
        </span>
      </div>

      {loading ? (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat daftar fasilitas...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-icon">🏥</div>
          <p>Tidak ada fasilitas ditemukan</p>
        </div>
      ) : (
        <div className="rs-card-grid">
          {filteredList.map(rs => (
            <RsSelectorCard key={rs.id} rs={rs} onSelect={setSelectedRs} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Asuransi;