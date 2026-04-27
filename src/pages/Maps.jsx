import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/style.css';

// Fix icon Leaflet yang broken saat di-bundle Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',    import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png',  import.meta.url).href,
});

const API_URL = import.meta.env.VITE_API_BASE_URL;   // http://…/api
const IMG_URL = import.meta.env.VITE_IMAGE_BASE_URL; // http://…  (untuk path gambar)
const TOKEN   = localStorage.getItem('adminToken');
const authHeaders = { headers: { 'Authorization': `Bearer ${TOKEN}` } };

// ─── Koordinat kota-kota Indonesia sebagai fallback ───────────────────────────
const CITY_COORDS = {
  jakarta:     [-6.2088, 106.8456],
  surabaya:    [-7.2575, 112.7521],
  bandung:     [-6.9175, 107.6191],
  medan:       [ 3.5952,  98.6722],
  semarang:    [-6.9667, 110.4167],
  makassar:    [-5.1477, 119.4327],
  palembang:   [-2.9761, 104.7754],
  tangerang:   [-6.1781, 106.6297],
  depok:       [-6.4025, 106.7942],
  bogor:       [-6.5971, 106.8060],
  bekasi:      [-6.2383, 106.9756],
  yogyakarta:  [-7.7956, 110.3695],
  malang:      [-7.9666, 112.6326],
  denpasar:    [-8.6705, 115.2126],
  balikpapan:  [-1.2675, 116.8289],
  pontianak:   [-0.0263, 109.3425],
  manado:      [ 1.4748, 124.8421],
  pekanbaru:   [ 0.5071, 101.4478],
  samarinda:   [-0.5016, 117.1537],
  banjarmasin: [-3.3194, 114.5908],
  menteng:     [-6.1944, 106.8300],
  kedoya:      [-6.1635, 106.7622],
  anwari:      [-6.1301, 106.8201],
  primasana:   [-6.2945, 106.8756],
  candi:       [-7.0305, 110.4284],
  default:     [-2.5, 118.0],
};

function extractCoordsFromUrl(url) {
  if (!url) return null;
  try {
    let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];
    m = url.match(/[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];
    m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];
    m = url.match(/destination=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  } catch {}
  return null;
}

function guessCoordsFromTitle(title) {
  if (!title) return CITY_COORDS.default;
  const lower = title.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(city)) return coords;
  }
  return CITY_COORDS.default;
}

function getCoords(map) {
  // ✅ Prioritas 1: koordinat dari DB (sudah di-resolve backend saat simpan)
  if (map.latitude && map.longitude) {
    return [parseFloat(map.latitude), parseFloat(map.longitude)];
  }
  // Prioritas 2: ekstrak dari URL (fallback kalau DB kosong)
  const fromUrl = extractCoordsFromUrl(map.map_url);
  if (fromUrl) return fromUrl;
  // Prioritas 3: tebak dari nama kota
  return guessCoordsFromTitle(map.title);
}

// ─── Virtual Tour Modal ───────────────────────────────────────────────────────
function TourModal({ url, title, onClose }) {
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef(null);

  // Deteksi iframe diblokir lewat timer — kalau 4 detik tidak load, anggap blocked
  useEffect(() => {
    setIframeError(false);
    const timer = setTimeout(() => {
      try {
        // Coba akses contentDocument — kalau null/error = diblokir
        const doc = iframeRef.current?.contentDocument;
        if (!doc || doc.body?.innerHTML === '') setIframeError(true);
      } catch {
        setIframeError(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [url]);

  const handleIframeError = () => setIframeError(true);

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '16px',
          overflow: 'hidden',
          width: '92vw',
          maxWidth: '960px',
          height: '82vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.25rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🏛️</span>
            <div>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Virtual Tour
              </p>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.2 }}>
                {title}
              </h3>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '5px 12px', background: 'rgba(255,255,255,0.18)', color: '#fff',
                borderRadius: '7px', fontSize: '0.75rem', fontWeight: 600,
                textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              ↗ Buka Tab Baru
            </a>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
                width: '34px', height: '34px', cursor: 'pointer', color: '#fff',
                fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        </div>

        {/* Konten */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Iframe selalu di-render, tapi kalau blocked tampil overlay */}
          <iframe
            ref={iframeRef}
            src={url}
            title={`Virtual Tour - ${title}`}
            onError={handleIframeError}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allowFullScreen
            allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          />

          {/* Overlay fallback kalau iframe diblokir */}
          {iframeError && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '1rem', padding: '2rem', textAlign: 'center',
            }}>
              <div style={{ fontSize: '3rem' }}>🔒</div>
              <h3 style={{ margin: 0, color: 'var(--gray-800)', fontSize: '1.05rem' }}>
                Virtual Tour tidak bisa ditampilkan di sini
              </h3>
              <p style={{ margin: 0, color: 'var(--gray-600)', fontSize: '0.88rem', maxWidth: '360px', lineHeight: 1.6 }}>
                Website virtual tour ini memblokir penampilan embed. Klik tombol di bawah untuk membukanya di tab baru.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.65rem 1.5rem',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  color: '#fff', borderRadius: '10px', fontWeight: 700,
                  fontSize: '0.9rem', textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(46,125,50,0.35)',
                }}
              >
                🏛️ Buka Virtual Tour
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Leaflet Map ──────────────────────────────────────────────────────────────
function LeafletMap({ maps, selectedId, onMarkerClick, onOpenTour }) {
  const mapRef        = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef    = useRef({});

  // Init peta sekali saja
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    // Batas wilayah Indonesia: SW (ujung selatan-barat) → NE (ujung utara-timur)
    const INDONESIA_BOUNDS = L.latLngBounds(
      L.latLng(-11.5,  94.5),  // South-West: selatan Pulau Rote, barat Sabang
      L.latLng(  6.5, 141.5),  // North-East:  utara Miangas, timur Merauke
    );

    const map = L.map(mapRef.current, {
      center:             [-2.5, 118.0],
      zoom:               5,
      minZoom:            4,        // tidak bisa zoom-out lebih jauh (Indonesia masih kelihatan)
      maxZoom:            18,
      maxBounds:          INDONESIA_BOUNDS,
      maxBoundsViscosity: 1.0,      // rigid — tidak bisa drag/pan keluar batas Indonesia
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 18,
      bounds:  INDONESIA_BOUNDS,    // tile hanya di-load untuk area Indonesia
    }).addTo(map);

    leafletMapRef.current = map;
  }, []);

  // Re-render marker saat data berubah
  useEffect(() => {
    if (!leafletMapRef.current) return;
    renderMarkers(maps);
  }, [maps]);

  // Highlight marker terpilih
  useEffect(() => {
    if (!leafletMapRef.current) return;
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      marker.setIcon(makeIcon(String(id) === String(selectedId)));
    });
    if (selectedId) {
      const marker = markersRef.current[selectedId];
      if (marker) {
        leafletMapRef.current.setView(marker.getLatLng(), 14, { animate: true });
        marker.openPopup();
      }
    }
  }, [selectedId]);

  // Cleanup peta saat unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  function makeIcon(isSelected) {
    const color  = isSelected ? '#1B5E20' : '#2E7D32';
    const border = isSelected ? '#ffffff' : '#A5D6A7';
    const size   = isSelected ? 40 : 32;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 40 50">
      <filter id="ds${size}"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/></filter>
      <path fill="${color}" stroke="${border}" stroke-width="2.5" filter="url(#ds${size})"
        d="M20 2C12.268 2 6 8.268 6 16c0 10.627 14 30 14 30s14-19.373 14-30C34 8.268 27.732 2 20 2z"/>
      <circle cx="20" cy="16" r="7" fill="white" opacity="0.95"/>
      <text x="20" y="20" text-anchor="middle" font-size="8.5" fill="${color}" font-weight="700" font-family="Arial,sans-serif">RS</text>
    </svg>`;
    return L.divIcon({
      html: svg, className: '',
      iconSize:    [size, size + 10],
      iconAnchor:  [size / 2, size + 10],
      popupAnchor: [0, -(size + 6)],
    });
  }

  function buildPopupHtml(item) {
    const imageHtml = item.image
      ? `<img src="${IMG_URL}/${item.image}" alt="${item.title}"
           style="width:calc(100% + 28px);height:88px;object-fit:cover;
                  border-radius:8px 8px 0 0;display:block;margin:-12px -14px 10px"/>`
      : `<div style="width:calc(100% + 28px);height:68px;margin:-12px -14px 10px;
           background:linear-gradient(135deg,#c8e6c9,#81c784);border-radius:8px 8px 0 0;
           display:flex;align-items:center;justify-content:center;font-size:1.8rem">📍</div>`;

    const safeUrl   = item.virtual_tour_url?.replace(/'/g, "\\'") ?? '';
    const safeTitle = item.title?.replace(/'/g, "\\'") ?? '';

    return `
      <div style="font-family:Inter,sans-serif;padding:2px 0;min-width:200px">
        ${imageHtml}
        <div style="font-weight:700;font-size:0.88rem;color:#1B5E20;margin-bottom:8px;line-height:1.3">${item.title}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <a href="${item.map_url}" target="_blank" rel="noopener noreferrer"
            style="padding:4px 10px;background:#2E7D32;color:#fff;border-radius:6px;
                   font-size:0.72rem;font-weight:600;text-decoration:none">📍 Lihat Peta</a>
          ${item.virtual_tour_url
            ? `<button onclick="window.__openTourModal('${safeUrl}','${safeTitle}')"
                style="padding:4px 10px;background:#E8F5E9;color:#1B5E20;border:1px solid #A5D6A7;
                       border-radius:6px;font-size:0.72rem;font-weight:600;cursor:pointer">🏛️ Virtual Tour</button>`
            : ''}
        </div>
      </div>`;
  }

  function renderMarkers(data) {
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    if (!data?.length) return;

    const bounds = [];
    data.forEach(item => {
      const coords = getCoords(item);
      bounds.push(coords);
      const marker = L.marker(coords, { icon: makeIcon(false) })
        .bindPopup(L.popup({ className: 'map-rs-popup', maxWidth: 260 }).setContent(buildPopupHtml(item)))
        .on('click', () => onMarkerClick(item.id));
      marker.addTo(leafletMapRef.current);
      markersRef.current[item.id] = marker;
    });

    try { leafletMapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 }); } catch {}
  }

  return (
    <div ref={mapRef} style={{
      width: '100%', height: '440px', borderRadius: '14px',
      border: '1.5px solid var(--gray-200)', boxShadow: 'var(--shadow-md)',
      overflow: 'hidden', zIndex: 0,
    }} />
  );
}

// ─── Map RS Card ──────────────────────────────────────────────────────────────
function MapRsCard({ map, isSelected, onClick, onOpenTour }) {
  const imageUrl = map.image ? `${IMG_URL}/${map.image}` : null;

  return (
    <div
      className={`rs-card map-rs-card${isSelected ? ' map-rs-card--selected' : ''}`}
      onClick={() => onClick(null)}
      style={{ cursor: 'pointer' }}
    >
      <div className="rs-card-image-wrap">
        {imageUrl
          ? <img src={imageUrl} alt={map.title} className="rs-card-image" />
          : <div className="rs-card-image-placeholder">📍</div>
        }
      </div>
      <div className="rs-card-body">
        <h3 className="rs-card-title">{map.title}</h3>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
          <a
            href={map.map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="map-card-link-btn"
            onClick={e => e.stopPropagation()}
          >🗺️ Peta</a>
          {map.virtual_tour_url && (
            <button
              className="map-card-link-btn map-card-link-btn--tour"
              onClick={e => { e.stopPropagation(); onOpenTour(map.virtual_tour_url, map.title); }}
            >🏛️ Tour</button>
          )}
        </div>
        <div className="map-card-actions">
          <button className="map-card-edit-btn"
            onClick={e => { e.stopPropagation(); onClick('edit'); }}>✏️ Edit</button>
          <button className="map-card-delete-btn"
            onClick={e => { e.stopPropagation(); onClick('delete'); }}>🗑️ Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Maps Component ──────────────────────────────────────────────────────
function Maps() {
  const [mapsData,     setMapsData]     = useState([]);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedId,   setSelectedId]   = useState(null);

  // Modal Virtual Tour
  const [tourModal, setTourModal] = useState({ open: false, url: '', title: '' });
  const openTourModal  = (url, title) => setTourModal({ open: true, url, title });
  const closeTourModal = () => setTourModal({ open: false, url: '', title: '' });

  // Expose ke window untuk dipanggil dari popup Leaflet (HTML string)
  useEffect(() => {
    window.__openTourModal = openTourModal;
    return () => { delete window.__openTourModal; };
  }, []);

  // Modal Tambah
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nama_rs: '', map_url: '', virtual_tour_url: '' });

  // Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMap,     setSelectedMap]     = useState(null);
  const [editFormData,    setEditFormData]     = useState({ id: '', nama_rs: '', map_url: '', virtual_tour_url: '' });

  // Modal Hapus
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete,       setItemToDelete]        = useState(null);

  const fetchMapsData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API_URL}/admin/maps`, authHeaders);
      setMapsData(res.data.data || []);
    } catch {
      setError('Gagal memuat data lokasi. Pastikan Anda sudah login.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMapsData(); }, []);
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(''), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const filteredMaps = mapsData.filter(m =>
    m.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── CRUD handlers ──
  const handleFormChange     = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleEditFormChange  = e => setEditFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/maps`, formData, authHeaders);
      setToastMessage('Data lokasi baru berhasil ditambahkan.');
      setIsModalOpen(false);
      setFormData({ nama_rs: '', map_url: '', virtual_tour_url: '' });
      fetchMapsData();
    } catch (err) { setError(err.response?.data?.message || 'Gagal menyimpan data.'); }
  };

  const handleOpenEditModal = map => {
    setSelectedMap(map);
    setEditFormData({ id: map.id, nama_rs: map.title, map_url: map.map_url, virtual_tour_url: map.virtual_tour_url || '' });
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => { setIsEditModalOpen(false); setSelectedMap(null); };

  const handleEditSubmit = async e => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/admin/maps/${editFormData.id}`, editFormData, authHeaders);
      setToastMessage('Data lokasi berhasil diperbarui.');
      handleCloseEditModal(); fetchMapsData();
    } catch (err) { setError(err.response?.data?.message || 'Gagal memperbarui data.'); }
  };

  const handleOpenConfirmModal  = map => { setItemToDelete(map); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => { setItemToDelete(null); setIsConfirmModalOpen(false); };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await axios.delete(`${API_URL}/admin/maps/${itemToDelete.id}`, authHeaders);
      setToastMessage('Data lokasi berhasil dihapus.');
      handleCloseConfirmModal();
      if (selectedId === itemToDelete.id) setSelectedId(null);
      fetchMapsData();
    } catch { setError('Gagal menghapus data lokasi.'); }
  };

  const handleCardAction = (map, action) => {
    if (action === 'edit')   { handleOpenEditModal(map); return; }
    if (action === 'delete') { handleOpenConfirmModal(map); return; }
    setSelectedId(prev => prev === map.id ? null : map.id);
  };

  return (
    <div className="crud-page">

      {/* Header */}
      <div className="crud-page-header">
        <h1>Manajemen Lokasi Maps</h1>
        <div className="crud-header-controls">
          <div className="search-container">
            <input
              type="text" placeholder="Cari berdasarkan nama RS..."
              className="search-input" value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="add-button" onClick={() => setIsModalOpen(true)}>
            <span>➕</span> Tambah Lokasi
          </button>
        </div>
      </div>

      {loading  && <div className="loading-state">Memuat data lokasi...</div>}
      {!loading && error && <div className="error-state">{error}</div>}

      {!loading && !error && (
        <>
          {/* Peta */}
          <div style={{ marginBottom: '1.75rem' }}>
            {filteredMaps.length === 0 ? (
              <div style={{
                height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--gray-100)', borderRadius: '14px', color: 'var(--gray-500)',
                flexDirection: 'column', gap: '0.5rem', border: '1.5px dashed var(--gray-300)',
              }}>
                <span style={{ fontSize: '2rem' }}>🗺️</span>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Tidak ada lokasi yang ditemukan</p>
              </div>
            ) : (
              <LeafletMap
                maps={filteredMaps}
                selectedId={selectedId}
                onMarkerClick={id => setSelectedId(prev => prev === id ? null : id)}
                onOpenTour={openTourModal}
              />
            )}
          </div>

          {/* Summary */}
          <div className="users-summary-bar" style={{ marginBottom: '1rem' }}>
            <span className="users-count-label">
              Menampilkan <strong>{filteredMaps.length}</strong> dari <strong>{mapsData.length}</strong> lokasi
              {selectedId && (
                <span style={{ marginLeft: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                  · 1 lokasi dipilih
                  <button onClick={() => setSelectedId(null)} style={{
                    marginLeft: '6px', background: 'none', border: 'none',
                    color: 'var(--gray-500)', cursor: 'pointer', fontSize: '0.85rem',
                  }}>✕ hapus pilihan</button>
                </span>
              )}
            </span>
          </div>

          {/* Card Grid */}
          {filteredMaps.length === 0 ? (
            <div className="users-empty">
              <div className="users-empty-icon">📍</div>
              <p>Tidak ada lokasi ditemukan</p>
            </div>
          ) : (
            <div className="rs-card-grid">
              {filteredMaps.map(map => (
                <MapRsCard
                  key={map.id} map={map} isSelected={selectedId === map.id}
                  onClick={action => handleCardAction(map, action)}
                  onOpenTour={openTourModal}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Modal: Virtual Tour ── */}
      {tourModal.open && (
        <TourModal
          url={tourModal.url}
          title={tourModal.title}
          onClose={closeTourModal}
        />
      )}

      {/* ── Modal: Tambah ── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Lokasi Baru</h2>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="nama_rs">Nama RS</label>
                  <input type="text" id="nama_rs" name="nama_rs" value={formData.nama_rs} onChange={handleFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="map_url">Map URL</label>
                  <input type="url" id="map_url" name="map_url" value={formData.map_url} onChange={handleFormChange} required placeholder="https://maps.app.goo.gl/..." />
                  <small style={{ color: 'var(--gray-600)', marginTop: '4px', display: 'block' }}>
                    💡 Salin link dari Google Maps agar koordinat otomatis muncul di peta.
                  </small>
                </div>
                <div className="modal-form-group">
                  <label htmlFor="virtual_tour_url">Virtual Tour URL (Opsional)</label>
                  <input type="url" id="virtual_tour_url" name="virtual_tour_url" value={formData.virtual_tour_url} onChange={handleFormChange} placeholder="https://tour.example.com/..." />
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

      {/* ── Modal: Edit ── */}
      {isEditModalOpen && selectedMap && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Lokasi: {selectedMap.title}</h2>
              <button className="modal-close-btn" onClick={handleCloseEditModal}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label htmlFor="edit-nama_rs">Nama RS</label>
                  <input type="text" id="edit-nama_rs" name="nama_rs" value={editFormData.nama_rs} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-map_url">Map URL</label>
                  <input type="url" id="edit-map_url" name="map_url" value={editFormData.map_url} onChange={handleEditFormChange} required />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="edit-virtual_tour_url">Virtual Tour URL (Opsional)</label>
                  <input type="url" id="edit-virtual_tour_url" name="virtual_tour_url" value={editFormData.virtual_tour_url} onChange={handleEditFormChange} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseEditModal}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Konfirmasi Hapus ── */}
      {isConfirmModalOpen && (
        <div className="modal-overlay confirmation-modal" onClick={handleCloseConfirmModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseConfirmModal}>×</button>
            <div className="modal-body">
              <div className="modal-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="modal-body-content">
                <h2>Konfirmasi Hapus</h2>
                <p>Apakah Anda yakin ingin menghapus lokasi: <strong>{itemToDelete?.title}</strong>?</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleCloseConfirmModal}>Batal</button>
              <button type="button" className="btn-danger" onClick={handleDeleteConfirm}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div className="toast-notification">{toastMessage}</div>}
    </div>
  );
}

export default Maps;