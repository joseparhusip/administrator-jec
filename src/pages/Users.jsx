import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/style.css';

// ── Konfigurasi API ──
const API_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL; // untuk path gambar
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/admin/users`;
const WILAYAH_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/proxy-wilayah`;

const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const STATUS_PERKAWINAN_OPTIONS = ['Belum Kawin', 'Kawin', 'Cerai Hidup', 'Cerai Mati'];
const KEWARGANEGARAAN_OPTIONS = ['WNI', 'WNA'];

const initialFormData = {
  name: '', email: '', password: '',
  profile_image: null, ktp_image: null,
  nik: '', phone_number: '', place_of_birth: '', date_of_birth: '',
  alamat: '', agama: '', status_perkawinan: '', kewarganegaraan: '',
  province_id: '', province_name: '',
  city_id: '', city_name: '',
  district_id: '', district_name: '',
  village_id: '', village_name: '',
};

const getImageUrl = (imgPath, type = 'general') => {
  if (!imgPath) return null;
  if (imgPath.startsWith('http')) return imgPath;
  // Path sudah absolut dari assets/ → langsung tambah base URL
  if (imgPath.startsWith('assets/')) return `${API_BASE_URL}/${imgPath}`;
  // Path relatif khusus KTP: "ktp/nama-nik.jpg" → assets/ktp/
  if (imgPath.startsWith('ktp/')) return `${API_BASE_URL}/assets/${imgPath}`;
  // Path relatif user profile: hanya nama file
  if (type === 'user') return `${API_BASE_URL}/assets/users/${imgPath}`;
  return `${API_BASE_URL}/${imgPath.startsWith('/') ? imgPath.slice(1) : imgPath}`;
};

// ── Helper: ambil nama file dari path KTP ──
const getKtpFilename = (ktpPath) => {
  if (!ktpPath) return null;
  return ktpPath.split('/').pop();
};

function generatePassword(length = 12) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = pwd.length; i < length; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  return pwd.sort(() => Math.random() - 0.5).join('');
}

function generateEmail(name) {
  if (!name) return `user${Date.now()}@example.com`;
  const clean = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'mail.com'];
  return `${clean}${rand}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

let provincesPromiseCache = null;

function useWilayah() {
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loadingWilayah, setLoadingWilayah] = useState({});

  useEffect(() => {
    if (!provincesPromiseCache) {
      provincesPromiseCache = fetch(`${WILAYAH_BASE_URL}/provinces.json`)
        .then(r => r.json())
        .then(d => (d.data || []).map(e => ({ id: e.code, name: e.name })))
        .catch(() => { provincesPromiseCache = null; return []; });
    }
    provincesPromiseCache.then(data => setProvinces(data));
  }, []);

  const loadCities = useCallback(async (provinceId) => {
    if (!provinceId) { setCities([]); setDistricts([]); setVillages([]); return; }
    setLoadingWilayah(p => ({ ...p, cities: true }));
    try {
      const r = await fetch(`${WILAYAH_BASE_URL}/regencies/${provinceId}.json`);
      const d = await r.json();
      setCities((d.data || []).map(e => ({ id: e.code, name: e.name })));
      setDistricts([]); setVillages([]);
    } catch {}
    setLoadingWilayah(p => ({ ...p, cities: false }));
  }, []);

  const loadDistricts = useCallback(async (cityId) => {
    if (!cityId) { setDistricts([]); setVillages([]); return; }
    setLoadingWilayah(p => ({ ...p, districts: true }));
    try {
      const r = await fetch(`${WILAYAH_BASE_URL}/districts/${cityId}.json`);
      const d = await r.json();
      setDistricts((d.data || []).map(e => ({ id: e.code, name: e.name })));
      setVillages([]);
    } catch {}
    setLoadingWilayah(p => ({ ...p, districts: false }));
  }, []);

  const loadVillages = useCallback(async (districtId) => {
    if (!districtId) { setVillages([]); return; }
    setLoadingWilayah(p => ({ ...p, villages: true }));
    try {
      const r = await fetch(`${WILAYAH_BASE_URL}/villages/${districtId}.json`);
      const d = await r.json();
      setVillages((d.data || []).map(e => ({ id: e.code, name: e.name })));
    } catch {}
    setLoadingWilayah(p => ({ ...p, villages: false }));
  }, []);

  return { provinces, cities, districts, villages, loadingWilayah, loadCities, loadDistricts, loadVillages, setCities, setDistricts, setVillages };
}

function WilayahDropdowns({ formData, onChange, wilayah }) {
  const { provinces, cities, districts, villages, loadingWilayah, loadCities, loadDistricts, loadVillages } = wilayah;

  const handleProvince = (e) => {
    const sel = provinces.find(p => p.id === e.target.value);
    onChange({ province_id: sel?.id || '', province_name: sel?.name || '', city_id: '', city_name: '', district_id: '', district_name: '', village_id: '', village_name: '' });
    loadCities(sel?.id || '');
  };
  const handleCity = (e) => {
    const sel = cities.find(c => c.id === e.target.value);
    onChange({ city_id: sel?.id || '', city_name: sel?.name || '', district_id: '', district_name: '', village_id: '', village_name: '' });
    loadDistricts(sel?.id || '');
  };
  const handleDistrict = (e) => {
    const sel = districts.find(d => d.id === e.target.value);
    onChange({ district_id: sel?.id || '', district_name: sel?.name || '', village_id: '', village_name: '' });
    loadVillages(sel?.id || '');
  };
  const handleVillage = (e) => {
    const sel = villages.find(v => v.id === e.target.value);
    onChange({ village_id: sel?.id || '', village_name: sel?.name || '' });
  };

  return (
    <>
      <div className="modal-form-group">
        <label>Provinsi</label>
        <select value={formData.province_id} onChange={handleProvince}>
          <option value="">-- Pilih Provinsi --</option>
          {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="modal-form-group">
        <label>Kota / Kabupaten</label>
        <select value={formData.city_id} onChange={handleCity} disabled={!formData.province_id || loadingWilayah.cities}>
          <option value="">-- Pilih Kota/Kabupaten --</option>
          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {loadingWilayah.cities && <small style={{ color: '#888' }}>Memuat...</small>}
      </div>
      <div className="modal-form-group">
        <label>Kecamatan</label>
        <select value={formData.district_id} onChange={handleDistrict} disabled={!formData.city_id || loadingWilayah.districts}>
          <option value="">-- Pilih Kecamatan --</option>
          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        {loadingWilayah.districts && <small style={{ color: '#888' }}>Memuat...</small>}
      </div>
      <div className="modal-form-group">
        <label>Kelurahan / Desa</label>
        <select value={formData.village_id} onChange={handleVillage} disabled={!formData.district_id || loadingWilayah.villages}>
          <option value="">-- Pilih Kelurahan/Desa --</option>
          {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        {loadingWilayah.villages && <small style={{ color: '#888' }}>Memuat...</small>}
      </div>
    </>
  );
}

// ── Image Cropper Modal ──────────────────────────────────────────
function ImageCropperModal({ imageSrc, onConfirm, onCancel }) {
  const canvasRef = React.useRef(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [scale, setScale] = React.useState(1);
  const [dragging, setDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const imgRef = React.useRef(new Image());
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const SIZE = 300;

  React.useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      const fit = Math.max(SIZE / img.width, SIZE / img.height);
      setScale(fit);
      setOffset({ x: (SIZE - img.width * fit) / 2, y: (SIZE - img.height * fit) / 2 });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  React.useEffect(() => {
    if (!imgLoaded) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [imgLoaded, offset, scale]);

  const onMouseDown = (e) => { setDragging(true); setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y }); };
  const onMouseMove = (e) => { if (!dragging) return; setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); };
  const onMouseUp = () => setDragging(false);
  const onTouchStart = (e) => { const t = e.touches[0]; setDragging(true); setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y }); };
  const onTouchMove = (e) => { if (!dragging) return; const t = e.touches[0]; setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y }); };
  const onWheel = (e) => { e.preventDefault(); const delta = e.deltaY > 0 ? -0.05 : 0.05; setScale(s => Math.min(Math.max(s + delta, 0.3), 5)); };

  const handleConfirm = () => {
    const img = imgRef.current;
    const out = document.createElement('canvas');
    out.width = 400; out.height = 400;
    const ctx = out.getContext('2d');
    const ratio = 400 / SIZE;
    ctx.beginPath();
    ctx.arc(200, 200, 200, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, offset.x * ratio, offset.y * ratio, img.width * scale * ratio, img.height * scale * ratio);
    out.toBlob((blob) => {
      const file = new File([blob], `profile_crop_${Date.now()}.png`, { type: 'image/png' });
      onConfirm(file);
    }, 'image/png', 0.92);
  };

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 9999 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#212529' }}>Atur Foto Profil</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d', textAlign: 'center' }}>Geser foto untuk mengatur posisi · Scroll untuk zoom</p>
        <div style={{ borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', cursor: dragging ? 'grabbing' : 'grab' }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onMouseUp}
            onWheel={onWheel} style={{ display: 'block' }} />
        </div>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.75rem', color: '#6c757d' }}>Zoom</span>
          <input type="range" min="0.3" max="3" step="0.01" value={scale} onChange={e => setScale(parseFloat(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: '0.75rem', color: '#6c757d', minWidth: 36 }}>{Math.round(scale * 100)}%</span>
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: '0.65rem', border: '1.5px solid #dee2e6', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#495057' }}>Batal</button>
          <button type="button" onClick={handleConfirm} style={{ flex: 1, padding: '0.65rem', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg, #2E7D32, #388E3C)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>Gunakan Foto</button>
        </div>
      </div>
    </div>
  );
}

// ── Profile Image Input dengan Crop ─────────────────────────────
function ProfileImageInput({ onChange, existingUrl }) {
  const [rawSrc, setRawSrc] = React.useState(null);
  const [preview, setPreview] = React.useState(null);
  const inputRef = React.useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRawSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedFile) => {
    setRawSrc(null);
    setPreview(URL.createObjectURL(croppedFile));
    onChange(croppedFile);
  };

  const handleRemove = () => { setPreview(null); onChange(null); };

  const displayUrl = preview || existingUrl || null;

  return (
    <div className="modal-form-group">
      <label>Foto Profil</label>
      {displayUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <img src={displayUrl} alt="preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid #A5D6A7' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button type="button" onClick={() => inputRef.current.click()} style={{ fontSize: '0.78rem', padding: '4px 10px', border: '1px solid #dee2e6', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#495057' }}>Ganti Foto</button>
            {preview && <button type="button" onClick={handleRemove} style={{ fontSize: '0.78rem', padding: '4px 10px', border: '1px solid #fed7d7', borderRadius: 6, background: '#fff5f5', cursor: 'pointer', color: '#c0392b' }}>Hapus</button>}
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} style={displayUrl ? { display: 'none' } : {}} />
      {rawSrc && <ImageCropperModal imageSrc={rawSrc} onConfirm={handleCropConfirm} onCancel={() => setRawSrc(null)} />}
    </div>
  );
}

// ── User Card Component (Card Style seperti gambar) ──────────────────────────────────────────
function UserCard({ user, onViewDetail, onEdit, onDelete }) {
  const profileUrl = getImageUrl(user.profile_image, 'user');
  const initials = (user.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(user);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(user);
  };

  return (
    <div className="user-card" onClick={() => onViewDetail(user)}>
      {/* Banner atas */}
      <div className="user-card-banner">
        <div className={`user-card-status-dot ${user.otp_active ? 'active' : 'inactive'}`}
          title={user.otp_active ? 'OTP Aktif' : 'OTP Expired'} />
      </div>

      {/* Avatar melingkari border putih di tengah */}
      <div className="user-card-avatar-wrap">
        {profileUrl ? (
          <img src={profileUrl} alt={user.name} className="user-card-avatar" />
        ) : (
          <div className="user-card-avatar-placeholder">
            {initials}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="user-card-body">
        <h3 className="user-card-name">{user.name || 'Tanpa Nama'}</h3>
        <p className="user-card-email">{user.email || '-'}</p>
        {user.city_name && (
          <p className="user-card-location">
            📍 {user.city_name}{user.province_name ? `, ${user.province_name}` : ''}
          </p>
        )}
        <div className="user-card-meta">
          {user.kewarganegaraan && (
            <span className={`user-card-badge ${user.kewarganegaraan === 'WNI' ? 'badge-wni' : 'badge-wna'}`}>
              {user.kewarganegaraan}
            </span>
          )}
          {user.phone_number && (
            <span className="user-card-phone">{user.phone_number}</span>
          )}
        </div>
      </div>

      {/* Tombol Hapus & Edit */}
      <div className="user-card-actions">
        <button className="card__btn card__btn--hapus" onClick={handleDelete}>
          🗑 Hapus
        </button>
        <button className="card__btn card__btn--edit" onClick={handleEdit}>
          ✏ Edit
        </button>
      </div>
    </div>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────
function DetailModal({ user, onClose, onEdit, onDelete, onOpenImage }) {
  if (!user) return null;
  const profileUrl = getImageUrl(user.profile_image, 'user');
  const ktpUrl = getImageUrl(user.ktp_image_path, 'general');
  const initials = (user.name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const DetailRow = ({ label, value }) => (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || <span style={{ color: '#adb5bd', fontStyle: 'italic', fontWeight: 400 }}>N/A</span>}</span>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large detail-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-modal-hero">
          <div className="detail-modal-avatar-wrap">
            {profileUrl ? (
              <img
                src={profileUrl}
                alt={user.name}
                className="detail-modal-avatar"
                onClick={() => onOpenImage(profileUrl)}
                title="Klik untuk perbesar"
              />
            ) : (
              <div className="detail-modal-avatar-placeholder">
                {initials}
              </div>
            )}
          </div>
          <div className="detail-modal-hero-info">
            <div className="detail-modal-id">ID #{user.user_id}</div>
            <h2 className="detail-modal-name">{user.name || 'Tanpa Nama'}</h2>
            <p className="detail-modal-email">{user.email}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {user.kewarganegaraan && (
                <span className={`badge ${user.kewarganegaraan === 'WNI' ? 'badge-blue' : 'badge-orange'}`}>{user.kewarganegaraan}</span>
              )}
              <span className={`badge ${user.has_password ? 'badge-green' : 'badge-gray'}`}>
                {user.has_password ? 'Password Set' : 'Belum Ada Password'}
              </span>
              <span className={`badge ${user.otp_active ? 'badge-green' : 'badge-gray'}`}>
                OTP {user.otp_active ? 'Aktif' : 'Expired'}
              </span>
            </div>
          </div>
          <button className="modal-close-btn detail-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="detail-modal-body">
          <div className="detail-section">
            <h3>Kontak & Identitas</h3>
            <div className="detail-grid">
              <DetailRow label="Telepon" value={user.phone_number} />
              <DetailRow label="NIK" value={user.nik} />
              <DetailRow label="Agama" value={user.agama} />
              <DetailRow label="Status Perkawinan" value={user.status_perkawinan} />
              <DetailRow label="Tempat Lahir" value={user.place_of_birth} />
              <DetailRow label="Tanggal Lahir" value={user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />
            </div>
          </div>

          <div className="detail-section">
            <h3>Alamat Domisili</h3>
            <div className="detail-grid">
              <DetailRow label="Provinsi" value={user.province_name} />
              <DetailRow label="Kota / Kabupaten" value={user.city_name} />
              <DetailRow label="Kecamatan" value={user.district_name} />
              <DetailRow label="Kelurahan / Desa" value={user.village_name} />
            </div>
            {user.alamat && (
              <div className="detail-item" style={{ marginTop: '0.75rem' }}>
                <span className="detail-label">Alamat Lengkap</span>
                <span className="detail-value" style={{ fontWeight: 400, lineHeight: 1.6 }}>{user.alamat}</span>
              </div>
            )}
          </div>

          {ktpUrl && (
            <div className="detail-section">
              <h3>Foto KTP</h3>
              {/* ── Nama file KTP ── */}
              <div className="detail-item" style={{ marginBottom: '0.75rem' }}>
                <span className="detail-label">Nama File</span>
                <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#495057', background: '#f8f9fa', padding: '3px 8px', borderRadius: 5, display: 'inline-block' }}>
                  📄 {getKtpFilename(user.ktp_image_path)}
                </span>
              </div>
              {/* ── Thumbnail KTP (klik untuk perbesar) ── */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={ktpUrl}
                  alt="KTP"
                  className="detail-ktp-image"
                  onClick={() => onOpenImage(ktpUrl)}
                  title="Klik untuk perbesar"
                  style={{ cursor: 'zoom-in' }}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={ktpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.78rem', padding: '4px 12px', border: '1px solid #dee2e6', borderRadius: 6, background: '#fff', color: '#495057', textDecoration: 'none', display: 'inline-block' }}
                  >
                    🔗 Buka di Tab Baru
                  </a>
                  <a
                    href={ktpUrl}
                    download={getKtpFilename(user.ktp_image_path)}
                    style={{ fontSize: '0.78rem', padding: '4px 12px', border: '1px solid #A5D6A7', borderRadius: 6, background: '#f1f8f1', color: '#2E7D32', textDecoration: 'none', display: 'inline-block' }}
                  >
                    ⬇️ Unduh KTP
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3>Info Sistem</h3>
            <div className="detail-grid">
              <DetailRow label="Terdaftar" value={user.created_at ? new Date(user.created_at).toLocaleString('id-ID') : null} />
              <DetailRow label="OTP Expiry" value={user.otp_expiry ? new Date(user.otp_expiry).toLocaleString('id-ID') : null} />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Tutup</button>
          <button className="btn-edit-modal" onClick={() => onEdit(user)}>Edit User</button>
          <button className="btn-danger" onClick={() => onDelete(user)}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ── Password Strength Bar ────────────────────────────────────────
function PasswordStrengthBar({ password }) {
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const score = getStrength(password);
  const labels = ['', 'Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  const colors = ['', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, backgroundColor: i <= score ? colors[score] : '#ddd', transition: 'background-color 0.3s' }} />
        ))}
      </div>
      <small style={{ color: colors[score], fontWeight: 600 }}>{labels[score]}</small>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const [viewingUser, setViewingUser] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [showPassword, setShowPassword] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState(initialFormData);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  const addWilayah = useWilayah();
  const editWilayah = useWilayah();

  const showToast = (msg, type = 'success') => { setToastMessage(msg); setToastType(type); };

  const fetchUsers = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await axios.get(API_URL);
      const data = (response.data.data || []).map(u => ({
        ...u,
        has_password: Boolean(u.has_password),
        otp_active: typeof u.otp_active === 'boolean' ? u.otp_active : (u.otp_expiry ? new Date(u.otp_expiry) > new Date() : false),
      }));
      setUsers(data);
    } catch {
      setApiError('Gagal memuat data. Coba refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleFormChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'file' ? files[0] : value }));
  };
  const handleFormWilayahChange = (updates) => setFormData(prev => ({ ...prev, ...updates }));
  const handleGeneratePassword = () => { setFormData(prev => ({ ...prev, password: generatePassword() })); setShowPassword(true); };
  const handleGenerateEmail = () => setFormData(prev => ({ ...prev, email: generateEmail(formData.name) }));

  const handleEditFormChange = (e) => {
    const { name, value, type, files } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: type === 'file' ? files[0] : value }));
  };
  const handleEditWilayahChange = (updates) => setEditFormData(prev => ({ ...prev, ...updates }));
  const handleEditGeneratePassword = () => { setEditFormData(prev => ({ ...prev, password: generatePassword() })); setShowEditPassword(true); };
  const handleEditGenerateEmail = () => setEditFormData(prev => ({ ...prev, email: generateEmail(editFormData.name) }));

  const buildFormData = (data) => {
    const fd = new FormData();
    const skip = ['user_id', 'profile_image', 'ktp_image'];
    Object.keys(data).forEach(key => {
      if (!skip.includes(key) && data[key] !== null && data[key] !== undefined && data[key] !== '') fd.append(key, data[key]);
    });
    if (data.profile_image) fd.append('profile_image', data.profile_image);
    if (data.ktp_image) fd.append('ktp_image', data.ktp_image);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, buildFormData(formData), { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('User baru berhasil ditambahkan');
      fetchUsers();
      setIsModalOpen(false);
      setFormData(initialFormData);
      setShowPassword(false);
    } catch (error) {
      showToast(`Gagal: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleOpenEditModal = async (user) => {
    setViewingUser(null);
    setSelectedUser(user);
    const ed = {
      user_id: user.user_id,
      name: user.name || '', email: user.email || '', password: '',
      profile_image: null, ktp_image: null,
      nik: user.nik || '', phone_number: user.phone_number || '',
      place_of_birth: user.place_of_birth || '',
      date_of_birth: user.date_of_birth ? user.date_of_birth.split('T')[0] : '',
      alamat: user.alamat || '', agama: user.agama || '',
      status_perkawinan: user.status_perkawinan || '',
      kewarganegaraan: user.kewarganegaraan || '',
      province_id: user.province_id || '', province_name: user.province_name || '',
      city_id: user.city_id || '', city_name: user.city_name || '',
      district_id: user.district_id || '', district_name: user.district_name || '',
      village_id: user.village_id || '', village_name: user.village_name || '',
    };
    setEditFormData(ed);
    setIsEditModalOpen(true);
    if (user.province_id) {
      await editWilayah.loadCities(user.province_id);
      if (user.city_id) {
        await editWilayah.loadDistricts(user.city_id);
        if (user.district_id) await editWilayah.loadVillages(user.district_id);
      }
    }
  };

  const handleCloseEditModal = () => { setIsEditModalOpen(false); setSelectedUser(null); setEditFormData(initialFormData); setShowEditPassword(false); };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const fd = buildFormData(editFormData);
    if (!editFormData.password) fd.delete('password');
    try {
      await axios.put(`${API_URL}/${editFormData.user_id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Data user berhasil diperbarui');
      fetchUsers();
      handleCloseEditModal();
    } catch (error) {
      showToast(`Gagal: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  const handleOpenConfirmModal = (user) => {
    setViewingUser(null);
    setItemToDelete(user);
    setIsConfirmModalOpen(true);
  };
  const handleCloseConfirmModal = () => { setItemToDelete(null); setIsConfirmModalOpen(false); };
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${API_URL}/${itemToDelete.user_id}`);
      showToast('Data user berhasil dihapus');
      setUsers(prev => prev.filter(u => u.user_id !== itemToDelete.user_id));
    } catch (error) {
      showToast(`Gagal: ${error.response?.data?.message || error.message}`, 'error');
    }
    handleCloseConfirmModal();
  };

  const handleOpenImageModal = (url) => { setSelectedImageUrl(url); setIsImageModalOpen(true); };
  const handleCloseImageModal = () => { setIsImageModalOpen(false); setSelectedImageUrl(''); };

  const filteredUsers = users.filter(user =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.nik || '').includes(searchTerm)
  );

  const renderFormFields = (data, onChange, onWilayahChange, wilayah, isEdit = false, onProfileImageChange = null) => (
    <div className="form-grid">
      <div className="form-section-title full-width">Informasi Akun</div>
      <div className="modal-form-group">
        <label>Nama Lengkap <span className="required">*</span></label>
        <input type="text" name="name" value={data.name} onChange={onChange} required placeholder="Masukkan nama lengkap" />
      </div>
      <div className="modal-form-group">
        <label>Email <span className="required">*</span></label>
        <div className="input-with-btn">
          <input type="email" name="email" value={data.email} onChange={onChange} required placeholder="email@domain.com" />
          <button type="button" className="btn-generate" onClick={isEdit ? handleEditGenerateEmail : handleGenerateEmail}>Generate</button>
        </div>
      </div>
      <div className="modal-form-group">
        <label>{isEdit ? 'Password (Opsional)' : 'Password'} {!isEdit && <span className="required">*</span>}</label>
        <div className="input-with-btn">
          <div className="password-input-wrap">
            <input
              type={isEdit ? (showEditPassword ? 'text' : 'password') : (showPassword ? 'text' : 'password')}
              name="password" value={data.password} onChange={onChange} required={!isEdit}
              placeholder={isEdit ? 'Kosongkan jika tidak diubah' : 'Min. 8 karakter'}
            />
            <button type="button" className="btn-eye" onClick={() => isEdit ? setShowEditPassword(p => !p) : setShowPassword(p => !p)}>
              {(isEdit ? showEditPassword : showPassword) ? '🙈' : '👁️'}
            </button>
          </div>
          <button type="button" className="btn-generate" onClick={isEdit ? handleEditGeneratePassword : handleGeneratePassword}>Generate</button>
        </div>
        {data.password && <div className="password-strength"><PasswordStrengthBar password={data.password} /></div>}
      </div>
      <div className="modal-form-group">
        <label>No. Telepon</label>
        <input type="text" name="phone_number" value={data.phone_number} onChange={onChange} placeholder="08xxxxxxxxxx" />
      </div>
      <div className="form-section-title full-width">Identitas Diri</div>
      <div className="modal-form-group">
        <label>NIK</label>
        <input type="text" name="nik" value={data.nik} onChange={onChange} placeholder="16 digit NIK" maxLength={16} />
      </div>
      <div className="modal-form-group">
        <label>Tempat Lahir</label>
        <input type="text" name="place_of_birth" value={data.place_of_birth} onChange={onChange} placeholder="Kota tempat lahir" />
      </div>
      <div className="modal-form-group">
        <label>Tanggal Lahir</label>
        <input type="date" name="date_of_birth" value={data.date_of_birth} onChange={onChange} />
      </div>
      <div className="modal-form-group">
        <label>Agama</label>
        <select name="agama" value={data.agama} onChange={onChange}>
          <option value="">-- Pilih Agama --</option>
          {AGAMA_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="modal-form-group">
        <label>Status Perkawinan</label>
        <select name="status_perkawinan" value={data.status_perkawinan} onChange={onChange}>
          <option value="">-- Pilih Status --</option>
          {STATUS_PERKAWINAN_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="modal-form-group">
        <label>Kewarganegaraan</label>
        <select name="kewarganegaraan" value={data.kewarganegaraan} onChange={onChange}>
          <option value="">-- Pilih --</option>
          {KEWARGANEGARAAN_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>
      <div className="form-section-title full-width">Wilayah Domisili</div>
      <WilayahDropdowns formData={data} onChange={onWilayahChange} wilayah={wilayah} />
      <div className="modal-form-group full-width">
        <label>Alamat Lengkap</label>
        <textarea name="alamat" value={data.alamat} onChange={onChange} rows={3} placeholder="Jl. Contoh No. 1, RT/RW, Kelurahan..." />
      </div>
      <div className="form-section-title full-width">Foto</div>
      {onProfileImageChange ? (
        <ProfileImageInput
          onChange={onProfileImageChange}
          existingUrl={isEdit && selectedUser?.profile_image ? getImageUrl(selectedUser.profile_image, 'user') : null}
        />
      ) : (
        <div className="modal-form-group">
          <label>Foto Profil</label>
          <input type="file" name="profile_image" onChange={onChange} accept="image/*" />
        </div>
      )}
      <div className="modal-form-group">
        <label>Foto KTP</label>
        <input type="file" name="ktp_image" onChange={onChange} accept="image/*" />
        {isEdit && selectedUser?.ktp_image_path && (
          <small className="file-hint">
            File saat ini:{' '}
            <code style={{ background: '#f8f9fa', padding: '1px 5px', borderRadius: 3, fontSize: '0.78rem' }}>
              {getKtpFilename(selectedUser.ktp_image_path)}
            </code>
            {' · '}
            <a href={getImageUrl(selectedUser.ktp_image_path, 'general')} target="_blank" rel="noopener noreferrer">Lihat KTP</a>
          </small>
        )}
      </div>
    </div>
  );

  return (
    <div className="crud-page">
      {/* ── HEADER ── */}
      <div className="crud-page-header">
        <h1>Manajemen Users</h1>
        <div className="crud-header-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Cari nama, email, atau NIK..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={() => setIsModalOpen(true)}>
            <span>+</span> Tambah User
          </button>
        </div>
      </div>

      {/* ── SUMMARY BAR ── */}
      <div className="users-summary-bar">
        <span className="users-count-label">
          Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{users.length}</strong> user
        </span>
      </div>

      {/* ── CARD GRID ── */}
      {loading && (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat data pengguna...</p>
        </div>
      )}
      {apiError && (
        <div className="users-error">{apiError}</div>
      )}
      {!loading && !apiError && filteredUsers.length === 0 && (
        <div className="users-empty">
          <div className="users-empty-icon">👤</div>
          <p>Tidak ada user ditemukan</p>
          {searchTerm && <small>Coba kata kunci lain</small>}
        </div>
      )}
      {!loading && !apiError && (
        <div className="users-card-grid">
          {filteredUsers.map(user => (
            <UserCard
              key={user.user_id}
              user={user}
              onViewDetail={setViewingUser}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenConfirmModal}
            />
          ))}
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {viewingUser && (
        <DetailModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenConfirmModal}
          onOpenImage={handleOpenImageModal}
        />
      )}

      {/* ── ADD MODAL ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah User Baru</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">{renderFormFields(formData, handleFormChange, handleFormWilayahChange, addWilayah, false, (file) => setFormData(prev => ({ ...prev, profile_image: file })))}</div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User: <em>{selectedUser.name}</em></h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">{renderFormFields(editFormData, handleEditFormChange, handleEditWilayahChange, editWilayah, true, (file) => setEditFormData(prev => ({ ...prev, profile_image: file })))}</div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseEditModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ── */}
      {isConfirmModalOpen && (
        <div className="modal-overlay confirmation-modal" onClick={handleCloseConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseConfirmModal}>×</button>
            <div className="modal-body">
              <div className="modal-icon">⚠️</div>
              <div className="modal-body-content">
                <h2>Konfirmasi Hapus</h2>
                <p>Apakah Anda yakin ingin menghapus user: <strong>{itemToDelete?.name}</strong>?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCloseConfirmModal}>Batal</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE MODAL ── */}
      {isImageModalOpen && (
        <div className="modal-overlay" onClick={handleCloseImageModal}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseImageModal}>×</button>
            <img src={selectedImageUrl} alt="Preview" />
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`toast-notification ${toastType === 'error' ? 'error' : ''}`}>{toastMessage}</div>
      )}
    </div>
  );
}

export default Users;