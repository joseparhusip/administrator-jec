// path: src/pages/FasilitasRs.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosInstance';
import '../css/style.css';

// ✅ API URL dihandle axiosInstance
const IMG_URL = import.meta.env.VITE_IMAGE_BASE_URL; // http://…  (untuk path gambar)
const TOKEN = localStorage.getItem('adminToken');
const authHeaders = { headers: { 'Authorization': `Bearer ${TOKEN}` } };

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

// ── Detail View (setelah RS dipilih) ───────────────────────────
function DetailView({ rs, onBack }) {
    const [detail, setDetail] = useState({ images: [], services: [] });
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    // State untuk Pagination Galeri
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/fasilitas-rs/detail?fasilitas_id=${rs.id}`, authHeaders);
            if (res.data.success) {
                setDetail(res.data.data);
                setCurrentPage(1);
            }
        } catch (err) {
            console.error("Gagal ambil detail fasilitas:", err);
        } finally {
            setLoading(false);
        }
    }, [rs.id]);

    const validateImageFile = (file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 500 * 1024;
        if (!allowedTypes.includes(file.type)) {
            alert('Format gambar tidak didukung! Hanya JPG, PNG, dan WEBP.');
            return false;
        }
        if (file.size > maxSize) {
            alert(`Ukuran gambar terlalu besar! Maksimal 500KB. Ukuran Anda: ${(file.size / 1024).toFixed(0)}KB.`);
            return false;
        }
        return true;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!validateImageFile(file)) {
            e.target.value = '';
            setUploadFile(null);
            setUploadPreview(null);
            return;
        }
        setUploadFile(file);
        setUploadPreview(URL.createObjectURL(file));
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!uploadFile) {
            alert("Pilih gambar dulu!");
            return;
        }
        const data = new FormData();
        data.append('fasilitas_id', rs.id);
        data.append('image', uploadFile);
        try {
            await api.post('/admin/fasilitas-rs', data, authHeaders);
            setToastMessage('Gambar berhasil ditambahkan!');
            setIsModalOpen(false);
            setUploadFile(null);
            setUploadPreview(null);
            fetchDetail();
        } catch (err) {
            console.error(err);
            alert('Gagal upload gambar.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Yakin ingin menghapus gambar ini?')) {
            try {
                await api.delete(`/admin/fasilitas-rs/${id}`, authHeaders);
                setToastMessage('Gambar berhasil dihapus.');
                fetchDetail();
            } catch (err) {
                console.error('Gagal menghapus gambar:', err);
                alert('Gagal menghapus.');
            }
        }
    };

    // Logika Pagination Galeri
    const totalPages = Math.ceil(detail.images.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentGallery = detail.images.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const imageUrl = rs.image ? `${IMG_URL}/${rs.image}` : null;

    return (
        <div className="frs-main-container">
            {/* Back Button */}
            <button className="frs-back-btn" onClick={onBack}>
                ← Kembali ke Daftar Fasilitas
            </button>

            {/* Gallery Header */}
            <div className="frs-gallery-header">
                {imageUrl ? (
                    <img src={imageUrl} alt={rs.title} className="frs-gallery-header-img" />
                ) : (
                    <div className="frs-gallery-header-placeholder">🏥</div>
                )}
                <div className="frs-gallery-header-info">
                    <h2>{rs.title}</h2>
                    <p>{rs.location} &nbsp;·&nbsp; {rs.type}</p>
                </div>
                <button className="add-button" onClick={() => setIsModalOpen(true)}>
                    + Tambah Foto
                </button>
            </div>

            {/* Services Section */}
            <div className="frs-services-section">
                <h3>Layanan Tersedia</h3>
                {detail.services && detail.services.length === 0 ? (
                    <p className="frs-empty-text">Belum ada layanan yang ditambahkan.</p>
                ) : (
                    <ul className="frs-services-list">
                        {detail.services && detail.services.map((service, index) => (
                            <li key={index}>{service}</li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Summary */}
            <div className="users-summary-bar">
                <span className="users-count-label">
                    Menampilkan <strong>{detail.images.length === 0 ? 0 : indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, detail.images.length)}</strong> dari <strong>{detail.images.length}</strong> foto
                </span>
            </div>

            {/* Photo Grid */}
            {loading ? (
                <div className="users-loading">
                    <div className="users-loading-spinner" />
                    <p>Memuat foto...</p>
                </div>
            ) : detail.images.length === 0 ? (
                <div className="frs-empty">
                    <div className="frs-empty-icon">📷</div>
                    <p>Belum ada foto fasilitas untuk {rs.title}.</p>
                    <small>Klik "+ Tambah Foto" untuk mengunggah gambar.</small>
                </div>
            ) : (
                <>
                    <div className="frs-photo-grid">
                        {currentGallery.map(item => (
                            <div className="frs-photo-card" key={item.id}>
                                <img
                                    src={`${IMG_URL}/${item.image_url}`}
                                    alt="Fasilitas"
                                    className="frs-photo-img"
                                    onClick={() => window.open(`${IMG_URL}/${item.image_url}`, '_blank')}
                                    style={{ cursor: 'zoom-in' }}
                                />
                                <div className="frs-photo-footer">
                                    <span className="frs-photo-id">ID #{item.id}</span>
                                    <button className="frs-photo-delete-btn" onClick={() => handleDelete(item.id)}>Hapus</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Kontrol Pagination Galeri */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                                &laquo; Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>
                                    {page}
                                </button>
                            ))}
                            <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal Tambah Foto */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Tambah Foto Fasilitas</h2>
                            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddSubmit}>
                            <div className="modal-body">
                                <div className="modal-form-group">
                                    <label>Rumah Sakit</label>
                                    <input
                                        type="text"
                                        value={rs.title}
                                        disabled
                                        style={{ backgroundColor: '#f2f2f2', color: '#555', fontWeight: 'bold' }}
                                    />
                                    <small style={{ color: '#888' }}>Foto akan otomatis masuk ke fasilitas ini.</small>
                                </div>
                                <div className="modal-form-group">
                                    <label>Pilih Gambar <span style={{ fontSize: '0.8rem', color: '#888' }}>(JPG/PNG/WEBP, maks. 500KB)</span></label>
                                    <input type="file" onChange={handleFileChange} accept=".jpg,.jpeg,.png,.webp" required />
                                    {uploadPreview && (
                                        <div style={{ marginTop: '10px' }}>
                                            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px' }}>Preview:</p>
                                            <img src={uploadPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ddd' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Batal</button>
                                <button type="submit" className="btn-primary">Upload</button>
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
function FasilitasRs() {
    const [fasilitasList, setFasilitasList] = useState([]);
    const [filterType, setFilterType] = useState('Semua');
    const [loading, setLoading] = useState(true);
    const [selectedRs, setSelectedRs] = useState(null);

    // State untuk Pagination Main Fasilitas
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;

    useEffect(() => {
        const fetchFasilitas = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/fasilitas', authHeaders);
                if (res.data.success) setFasilitasList(res.data.data);
            } catch (err) {
                console.error("Gagal ambil daftar RS:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFasilitas();
    }, []);

    // Reset page saat filter berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType]);

    // Jika RS sudah dipilih → tampilkan DetailView
    if (selectedRs) {
        return <DetailView rs={selectedRs} onBack={() => setSelectedRs(null)} />;
    }

    const uniqueTypes = ['Semua', ...new Set(fasilitasList.map(f => f.type).filter(Boolean))];
    const filteredList = fasilitasList.filter(rs => {
        return filterType === 'Semua' || rs.type === filterType;
    });

    // Logika Pagination Main Fasilitas
    const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentFasilitas = filteredList.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="frs-main-container">
            {/* Header */}
            <div className="crud-page-header">
                <h1>Manajemen Fasilitas Rumah Sakit dan Klinik</h1>
                
                {/* ── SEJAJAR SATU BARIS DROPDOWN MODERN ── */}
                <div className="crud-header-controls" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                    <div className="custom-dropdown-wrapper" style={{ minWidth: '200px' }}>
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

            {/* Summary */}
            <div className="users-summary-bar">
                <span className="users-count-label">
                    Menampilkan <strong>{filteredList.length === 0 ? 0 : indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredList.length)}</strong> dari <strong>{filteredList.length}</strong> fasilitas
                </span>
            </div>

            {/* Card Grid */}
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
                <>
                    <div className="rs-card-grid">
                        {currentFasilitas.map(rs => (
                            <RsSelectorCard key={rs.id} rs={rs} onSelect={setSelectedRs} />
                        ))}
                    </div>

                    {/* Kontrol Pagination Main Fasilitas */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
                                &laquo; Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>
                                    {page}
                                </button>
                            ))}
                            <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default FasilitasRs;