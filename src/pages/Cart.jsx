import React, { useState, useEffect } from 'react';
import '../css/style.css';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL    = `${import.meta.env.VITE_API_BASE_URL}/admin/cart`;
const BASE_URL   = import.meta.env.VITE_IMAGE_BASE_URL;

const calcTotal = (cart) => {
  const subtotal  = (cart.harga_obat || 0) * cart.quantity;
  const discount  = cart.voucher_discount || 0;
  const poinVal   = cart.points_used || 0;
  return Math.max(subtotal - discount - poinVal, 0);
};

const getAvatarUrl = (cart) =>
  cart.user_avatar ? `${BASE_URL}/${cart.user_avatar}` : null;

function UserAvatar({ cart, size = 24, fontSize = '0.7rem' }) {
  const [imgError, setImgError] = React.useState(false);
  const avatarUrl = getAvatarUrl(cart);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={cart.user_name}
        onError={() => setImgError(true)}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid #fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}
      />
    );
  }
  return (
    <div className="cart-card-user-avatar" style={{ width: size, height: size, fontSize }}>
      {cart.user_name?.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Tombol Excel SVG Icon ─────────────────────────────────────────
const ExcelIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 13H16M8 17H16M10 9H14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function Cart() {
  const [cartData,    setCartData]    = useState([]);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [isLoading,   setIsLoading]   = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting,  setIsExporting]  = useState(false);

  const [selectedCart, setSelectedCart] = useState(null);

  const [isEditModalOpen,  setIsEditModalOpen]  = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [editFormData,     setEditFormData]     = useState({
    quantity: 0, voucher_code: '', voucher_discount: 0, points_used: 0,
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDelete,       setItemToDelete]       = useState(null);

  const fetchCartData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_URL);
      if (res.data.success) setCartData(res.data.data);
      else setToastMessage('Gagal mengambil data keranjang.');
    } catch (err) {
      setToastMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCartData(); }, []);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const handleOpenEdit = (cart, e) => {
    e?.stopPropagation();
    setSelectedCartItem(cart);
    setEditFormData({
      quantity:         cart.quantity,
      voucher_code:     cart.voucher_code || '',
      voucher_discount: cart.voucher_discount,
      points_used:      cart.points_used,
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type } = e.target;
    setEditFormData(p => ({
      ...p,
      [name]: type === 'number' ? (parseInt(value) || 0) : (value === '' ? null : value),
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/${selectedCartItem.cart_id}`, editFormData);
      if (res.data.success) {
        setToastMessage('Item keranjang berhasil diperbarui.');
        fetchCartData();
        setIsEditModalOpen(false);
        setSelectedCart(null);
      } else {
        setToastMessage('Gagal memperbarui.');
      }
    } catch (err) {
      setToastMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleOpenDelete = (cart, e) => {
    e?.stopPropagation();
    setItemToDelete(cart);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      const res = await axios.delete(`${API_URL}/${itemToDelete.cart_id}`);
      if (res.data.success) {
        setToastMessage('Item keranjang berhasil dihapus.');
        fetchCartData();
        setIsConfirmModalOpen(false);
        setSelectedCart(null);
        setItemToDelete(null);
      } else {
        setToastMessage('Gagal menghapus.');
      }
    } catch (err) {
      setToastMessage(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  // ── EXPORT EXCEL ──────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (filtered.length === 0) { setToastMessage('Tidak ada data untuk diekspor.'); return; }
    setIsExporting(true);
    try {
      const rows = filtered.map((cart, idx) => ({
        'No': idx + 1,
        'Cart ID': cart.cart_id,
        'Nama User': cart.user_name || '-',
        'Nama Obat': cart.nama_obat || '-',
        'Harga Satuan (Rp)': cart.harga_obat || 0,
        'Quantity': cart.quantity,
        'Subtotal (Rp)': (cart.harga_obat || 0) * cart.quantity,
        'Kode Voucher': cart.voucher_code || '-',
        'Diskon Voucher (Rp)': cart.voucher_discount || 0,
        'Poin Dipakai': cart.points_used || 0,
        'Total Bayar (Rp)': calcTotal(cart),
        'Dibuat': new Date(cart.created_at).toLocaleString('id-ID'),
        'Update': new Date(cart.updated_at).toLocaleString('id-ID'),
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 5 }, { wch: 10 }, { wch: 22 }, { wch: 25 },
        { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 16 },
        { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
      ];

      // Sheet Ringkasan
      const totalNilai = filtered.reduce((a, c) => a + calcTotal(c), 0);
      const ringkasan = [
        { 'Keterangan': 'Total Item Keranjang', 'Nilai': filtered.length },
        { 'Keterangan': 'Total Nilai Keranjang (Rp)', 'Nilai': `Rp ${totalNilai.toLocaleString('id-ID')}` },
        { 'Keterangan': 'Item Dengan Voucher', 'Nilai': filtered.filter(c => c.voucher_code).length },
        { 'Keterangan': 'Item Gunakan Poin', 'Nilai': filtered.filter(c => c.points_used > 0).length },
        { 'Keterangan': 'Diekspor Pada', 'Nilai': new Date().toLocaleString('id-ID') },
      ];
      const wsRing = XLSX.utils.json_to_sheet(ringkasan);
      wsRing['!cols'] = [{ wch: 30 }, { wch: 28 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Keranjang');
      XLSX.utils.book_append_sheet(wb, wsRing, 'Ringkasan');
      XLSX.writeFile(wb, `Keranjang_Belanja_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setToastMessage('Data berhasil diekspor ke Excel!');
    } catch (err) {
      setToastMessage('Gagal mengekspor data.');
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = cartData.filter(c =>
    c.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nama_obat?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImage = (cart) =>
    cart.obat_image ? `${BASE_URL}/${cart.obat_image}` : null;

  return (
    <div className="crud-page">

      {/* Header */}
      <div className="crud-page-header">
        <h1>Data Keranjang Belanja</h1>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Cari nama user atau obat..."
            className="search-input"
            style={{ margin: 0 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {/* ── Tombol Export Excel ── */}
          <button
            onClick={handleExportExcel}
            disabled={isExporting || isLoading || filtered.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 18px',
              backgroundColor: '#1D6F42',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '0.855rem', fontWeight: '700', cursor: 'pointer',
              opacity: (isExporting || isLoading || filtered.length === 0) ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(29,111,66,0.28)',
              transition: 'background-color 0.2s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!isExporting) { e.currentTarget.style.backgroundColor = '#155534'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1D6F42'; e.currentTarget.style.transform = 'translateY(0)'; }}
            title="Export data keranjang ke Excel"
          >
            <ExcelIcon />
            {isExporting ? 'Mengekspor...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="users-summary-bar">
        <span className="users-count-label">
          Menampilkan <strong>{filtered.length}</strong> dari <strong>{cartData.length}</strong> item keranjang
        </span>
      </div>

      {/* Card Grid */}
      {isLoading ? (
        <div className="users-loading">
          <div className="users-loading-spinner" />
          <p>Memuat data keranjang...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="users-empty">
          <div className="users-empty-icon">🛒</div>
          <p>Tidak ada item keranjang ditemukan</p>
        </div>
      ) : (
        <div className="cart-card-grid">
          {filtered.map(cart => {
            const imgSrc = getImage(cart);
            return (
              <div
                key={cart.cart_id}
                className="cart-card"
                onClick={() => setSelectedCart(cart)}
              >
                <div className="cart-card-img-wrap">
                  {imgSrc ? (
                    <img src={imgSrc} alt={cart.nama_obat} className="cart-card-img"
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div className="cart-card-img-placeholder" style={{ display: imgSrc ? 'none' : 'flex' }}>💊</div>
                  <div className="cart-card-qty-badge">×{cart.quantity}</div>
                </div>

                <div className="cart-card-body">
                  <h3 className="cart-card-obat">{cart.nama_obat}</h3>
                  <div className="cart-card-user">
                    <UserAvatar cart={cart} size={24} fontSize="0.7rem" />
                    <span className="cart-card-user-name">{cart.user_name}</span>
                  </div>

                  <div className="cart-card-price">
                    Rp {(cart.harga_obat || 0).toLocaleString('id-ID')}
                    <span className="cart-card-price-unit"> / pcs</span>
                  </div>

                  <div className="cart-card-badges">
                    {cart.voucher_code && (
                      <span className="cart-badge cart-badge-voucher">🎟 {cart.voucher_code}</span>
                    )}
                    {cart.points_used > 0 && (
                      <span className="cart-badge cart-badge-points">🪙 {cart.points_used.toLocaleString('id-ID')}</span>
                    )}
                  </div>

                  <div className="cart-card-total">
                    Total: <strong>Rp {calcTotal(cart).toLocaleString('id-ID')}</strong>
                  </div>
                </div>

                <div className="cart-card-footer" onClick={e => e.stopPropagation()}>
                  <button className="btn-edit cart-card-btn" onClick={e => handleOpenEdit(cart, e)}>✏️ Edit</button>
                  <button className="btn-delete cart-card-btn" onClick={e => handleOpenDelete(cart, e)}>🗑️ Hapus</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL DETAIL ── */}
      {selectedCart && !isEditModalOpen && !isConfirmModalOpen && (
        <div className="modal-overlay" onClick={() => setSelectedCart(null)}>
          <div className="modal-content cart-detail-modal" onClick={e => e.stopPropagation()}>

            <div className="cart-detail-hero">
              <div className="cart-detail-img-wrap">
                {getImage(selectedCart) ? (
                  <img src={getImage(selectedCart)} alt={selectedCart.nama_obat} className="cart-detail-img"
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div className="cart-detail-img-placeholder" style={{ display: getImage(selectedCart) ? 'none' : 'flex' }}>💊</div>
              </div>
              <div className="cart-detail-hero-info">
                <h2 className="cart-detail-obat-name">{selectedCart.nama_obat}</h2>
                <div className="cart-detail-user-row">
                  <UserAvatar cart={selectedCart} size={30} fontSize="0.8rem" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--gray-700)' }}>{selectedCart.user_name}</span>
                </div>
                <span className="cart-detail-cart-id">Cart ID #{selectedCart.cart_id}</span>
              </div>
            </div>

            <div className="cart-detail-stats">
              <div className="cart-detail-stat">
                <span className="cart-stat-label">Harga Satuan</span>
                <span className="cart-stat-value">Rp {(selectedCart.harga_obat || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="cart-detail-stat">
                <span className="cart-stat-label">Qty</span>
                <span className="cart-stat-value">× {selectedCart.quantity}</span>
              </div>
              <div className="cart-detail-stat">
                <span className="cart-stat-label">Subtotal</span>
                <span className="cart-stat-value">Rp {((selectedCart.harga_obat || 0) * selectedCart.quantity).toLocaleString('id-ID')}</span>
              </div>
              <div className="cart-detail-stat">
                <span className="cart-stat-label">Voucher</span>
                <span className="cart-stat-value">{selectedCart.voucher_code || '—'}</span>
              </div>
              <div className="cart-detail-stat">
                <span className="cart-stat-label">Diskon Voucher</span>
                <span className="cart-stat-value" style={{ color: '#e53935' }}>
                  {selectedCart.voucher_discount > 0 ? `- Rp ${selectedCart.voucher_discount.toLocaleString('id-ID')}` : '—'}
                </span>
              </div>
              <div className="cart-detail-stat">
                <span className="cart-stat-label">Poin Dipakai</span>
                <span className="cart-stat-value" style={{ color: '#f57c00' }}>
                  {selectedCart.points_used > 0 ? `🪙 ${selectedCart.points_used.toLocaleString('id-ID')}` : '—'}
                </span>
              </div>
            </div>

            <div className="cart-detail-total-bar">
              <span>Total Pembayaran</span>
              <strong>Rp {calcTotal(selectedCart).toLocaleString('id-ID')}</strong>
            </div>

            <div className="cart-detail-timestamps">
              <span>Dibuat: {new Date(selectedCart.created_at).toLocaleString('id-ID')}</span>
              <span>Update: {new Date(selectedCart.updated_at).toLocaleString('id-ID')}</span>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedCart(null)}>Tutup</button>
              <button className="btn-edit" onClick={e => { setSelectedCart(null); handleOpenEdit(selectedCart, e); }}>✏️ Edit</button>
              <button className="btn-danger" onClick={e => { setSelectedCart(null); handleOpenDelete(selectedCart, e); }}>🗑️ Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT ── */}
      {isEditModalOpen && selectedCartItem && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Item Keranjang #{selectedCartItem.cart_id}</h2>
              <button className="modal-close-btn" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: '14px', background: '#f8f9fa', padding: '12px 14px', borderRadius: '8px', fontSize: '0.88rem' }}>
                  <p><strong>User:</strong> {selectedCartItem.user_name}</p>
                  <p style={{ marginTop: 4 }}><strong>Obat:</strong> {selectedCartItem.nama_obat}</p>
                  <p style={{ marginTop: 4 }}><strong>Harga Satuan:</strong> Rp {(selectedCartItem.harga_obat || 0).toLocaleString('id-ID')}</p>
                </div>
                <div className="modal-form-group">
                  <label>Quantity</label>
                  <input type="number" name="quantity" value={editFormData.quantity} onChange={handleEditChange} min="1" required />
                </div>
                <div className="modal-form-group">
                  <label>Voucher Code</label>
                  <input type="text" name="voucher_code" value={editFormData.voucher_code || ''} onChange={handleEditChange} placeholder="Kosongkan jika tidak ada" />
                </div>
                <div className="modal-form-group">
                  <label>Voucher Discount (Rp)</label>
                  <input type="number" name="voucher_discount" value={editFormData.voucher_discount} onChange={handleEditChange} min="0" />
                </div>
                <div className="modal-form-group">
                  <label>Points Used</label>
                  <input type="number" name="points_used" value={editFormData.points_used} onChange={handleEditChange} min="0" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsEditModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-primary">Simpan Perubahan</button>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div className="modal-body-content">
                <h2>Konfirmasi Hapus</h2>
                <p>
                  Hapus <strong>{itemToDelete?.nama_obat}</strong> dari keranjang milik <strong>{itemToDelete?.user_name}</strong>?
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

export default Cart;