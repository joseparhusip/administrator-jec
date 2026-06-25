import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '../css/style.css';

const API_URL = import.meta.env.VITE_API_BASE_URL;
const IMG_URL = import.meta.env.VITE_IMAGE_BASE_URL;
const TOKEN = localStorage.getItem('adminToken');

const authHeaders = {
  headers: { 'Authorization': `Bearer ${TOKEN}` }
};

const getBase64ImageFromURL = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

// ── PAYMENT STATUS CONFIG ─────────────────────────────────────────────────────
const PAYMENT_STATUS_CONFIG = {
  belum_bayar: {
    label: 'Belum Bayar',
    color: '#6c757d',
    bg: '#f8f9fa',
    border: '#dee2e6',
    emoji: '⏳',
    nextAction: null,
  },
  menunggu_konfirmasi: {
    label: 'Menunggu Konfirmasi',
    color: '#856404',
    bg: '#fff3cd',
    border: '#ffc107',
    emoji: '🔔',
    nextAction: 'lunas',
    nextLabel: '✅ Konfirmasi Lunas',
    nextColor: '#28a745',
  },
  lunas: {
    label: 'Lunas',
    color: '#155724',
    bg: '#d4edda',
    border: '#28a745',
    emoji: '✅',
    nextAction: null,
  },
};

function Pesanan() {
  const location = useLocation();
  const navigate = useNavigate();

  const [pesananData, setPesananData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState('semua');
  const [loading, setLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // State untuk Notifikasi
  const [toastNotif, setToastNotif] = useState(null);

  // ── AUDIO NOTIFIKASI REFS ────────────────────────────────────────────────
  const notifAudioRef = useRef(null);
  const notifiedIdsRef = useRef(new Set());
  const isPendingRef = useRef(false);

  // ── Logic Utama Audio Looping Manual ──
  useEffect(() => {
      const pendingCount = pesananData.filter(i => i.payment_status === 'menunggu_konfirmasi').length;
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
  }, [pesananData]);

  // ── Inisialisasi Audio dengan Event Listener Manual ──
  useEffect(() => {
      const audio = new Audio('/src/assets/voice/pesanan_masuk.mp3');
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

  // ── AUTO-UPDATE FETCH (SILENT POLLING) ───────────────────────────────────
  const fetchPesanan = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/pesanan`, authHeaders);
      if (response.data.success) {
        const newData = response.data.data;

        setPesananData(prevData => {
          const newWaitingIds = newData
            .filter(i => i.payment_status === 'menunggu_konfirmasi')
            .map(i => i.pesanan_id);

          const brandNewIds = newWaitingIds.filter(
            id => !notifiedIdsRef.current.has(id)
          );

          if (brandNewIds.length > 0) {
            brandNewIds.forEach(id => notifiedIdsRef.current.add(id));

            setToastNotif({
              title: 'Pembayaran Baru!',
              desc: `Ada ${brandNewIds.length} pembayaran pesanan yang perlu diverifikasi.`
            });
          }

          if (newWaitingIds.length === 0) {
            notifiedIdsRef.current.clear();
          }

          return newData;
        });
      }
    } catch (err) {
      console.error("Error fetching pesanan:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPesanan(false);
    const interval = setInterval(() => fetchPesanan(true), 5000);
    return () => clearInterval(interval);
  }, [fetchPesanan]);

  // LOGIKA AUTO OPEN MODAL DARI DASHBOARD
  useEffect(() => {
    if (pesananData.length > 0 && location.state?.openDetailId) {
      const targetId = location.state.openDetailId;
      const isExist = pesananData.find(p => p.pesanan_id === targetId);
      if (isExist) handleViewDetail(targetId);
      navigate('.', { replace: true, state: {} });
    }
  }, [pesananData, location.state, navigate]);

  // ── KONFIRMASI PAYMENT STATUS oleh Admin ─────────────────────────────────
  const handleUpdatePaymentStatus = async (pesananId, newStatus, e) => {
    if (e) e.stopPropagation();

    const config = PAYMENT_STATUS_CONFIG[newStatus];
    const confirmMsg = newStatus === 'lunas'
      ? `Konfirmasi bahwa user sudah LUNAS membayar pesanan ini?\n\nSetelah dikonfirmasi, status pesanan akan otomatis berubah menjadi "Menunggu Pengambilan" dan pasien akan mendapat notifikasi untuk mengambil obatnya.`
      : `Ubah status pembayaran menjadi "${config?.label}"?`;

    if (!window.confirm(confirmMsg)) return;

    setUpdatingPayment(true);
    try {
      const res = await axios.patch(
        `${API_URL}/admin/pesanan/${pesananId}/payment-status`,
        { payment_status: newStatus },
        authHeaders
      );

      if (res.data.success) {
        if (newStatus !== 'menunggu_konfirmasi') {
          notifiedIdsRef.current.delete(pesananId);
        }

        alert(res.data.message);
        await fetchPesanan(true);

        if (isDetailOpen && selectedOrder?.pesanan_id === pesananId) {
          const detailRes = await axios.get(`${API_URL}/admin/pesanan/${pesananId}/detail`, authHeaders);
          if (detailRes.data.success) setSelectedOrder(detailRes.data.data);
        }
      } else {
        alert(res.data.message || 'Gagal mengupdate status.');
      }
    } catch (err) {
      console.error("Error update payment status:", err);
      alert('Terjadi kesalahan saat mengupdate status pembayaran.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  // ── FUNGSI UBAH STATUS JADI SELESAI (OBAT DISERAHKAN) ──────────────
  const handleCompleteOrder = async (pesananId, e) => {
    if (e) e.stopPropagation();

    const confirmMsg = `Apakah Anda yakin obat sudah diserahkan kepada pasien?\n\nStatus pesanan akan diubah menjadi "Selesai" secara permanen.`;
    if (!window.confirm(confirmMsg)) return;

    setUpdatingPayment(true);
    try {
      const res = await axios.patch(
        `${API_URL}/admin/pesanan/${pesananId}/status`,
        { status: 'Selesai' },
        authHeaders
      );

      if (res.data.success) {
        alert(res.data.message);
        await fetchPesanan(true);
        if (isDetailOpen && selectedOrder?.pesanan_id === pesananId) {
          const detailRes = await axios.get(`${API_URL}/admin/pesanan/${pesananId}/detail`, authHeaders);
          if (detailRes.data.success) setSelectedOrder(detailRes.data.data);
        }
      } else {
        alert(res.data.message || 'Gagal menyelesaikan pesanan.');
      }
    } catch (err) {
      console.error("Error complete order:", err);
      alert('Terjadi kesalahan saat menyelesaikan pesanan.');
    } finally {
      setUpdatingPayment(false);
    }
  };

  const handleViewDetail = async (id) => {
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setSelectedOrder(null);
    try {
      const res = await axios.get(`${API_URL}/admin/pesanan/${id}/detail`, authHeaders);
      if (res.data.success) setSelectedOrder(res.data.data);
    } catch (err) {
      alert("Gagal memuat detail pesanan.");
      setIsDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetailModal = () => {
    if (isDownloading) return;
    setIsDetailOpen(false);
    setSelectedOrder(null);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus riwayat pesanan ini?')) {
      try {
        await axios.delete(`${API_URL}/admin/pesanan/${id}`, authHeaders);
        alert('Pesanan berhasil dihapus.');
        fetchPesanan(true);
        if (isDetailOpen && selectedOrder?.pesanan_id === id) closeDetailModal();
      } catch (err) {
        alert('Gagal menghapus pesanan.');
      }
    }
  };

  const formatRupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // ── FITUR EXPORT EXCEL ────────────────────────────────────────────
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    setIsExporting(true);
    try {
      const pesananRows = filteredData.map((item, idx) => ({
        'No': idx + 1,
        'Kode Pesanan': item.kode_pesanan || '-',
        'Nama User': item.user_name || '-',
        'Status Pesanan': item.status || '-',
        'Status Bayar': PAYMENT_STATUS_CONFIG[item.payment_status]?.label || item.payment_status || '-',
        'Total Bayar': item.total_bayar || 0,
        'Total Bayar (Rp)': formatRupiah(item.total_bayar),
        'Tanggal Pesanan': new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      }));

      const wb = XLSX.utils.book_new();
      const wsPesanan = XLSX.utils.json_to_sheet(pesananRows);
      wsPesanan['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 22 }, { wch: 22 },
        { wch: 24 }, { wch: 18 }, { wch: 22 }, { wch: 22 },
      ];
      XLSX.utils.book_append_sheet(wb, wsPesanan, 'Data Pesanan');

      const totalPesanan = filteredData.length;
      const totalNilai = filteredData.reduce((acc, item) => acc + (item.total_bayar || 0), 0);
      const totalSelesai = filteredData.filter(i => i.status === 'Selesai').length;
      const totalMenunggu = filteredData.filter(i => i.status === 'Menunggu Pengambilan').length;
      const totalDibatalkan = filteredData.filter(i => i.status === 'Dibatalkan').length;
      const totalMenungguKonfirmasi = filteredData.filter(i => i.payment_status === 'menunggu_konfirmasi').length;
      const totalLunas = filteredData.filter(i => i.payment_status === 'lunas').length;

      const ringkasanRows = [
        { 'Keterangan': 'Total Pesanan', 'Nilai': totalPesanan },
        { 'Keterangan': 'Pesanan Selesai', 'Nilai': totalSelesai },
        { 'Keterangan': 'Menunggu Pengambilan', 'Nilai': totalMenunggu },
        { 'Keterangan': 'Dibatalkan', 'Nilai': totalDibatalkan },
        { 'Keterangan': '', 'Nilai': '' },
        { 'Keterangan': 'Menunggu Konfirmasi Bayar', 'Nilai': totalMenungguKonfirmasi },
        { 'Keterangan': 'Sudah Lunas', 'Nilai': totalLunas },
        { 'Keterangan': '', 'Nilai': '' },
        { 'Keterangan': 'Total Nilai Transaksi', 'Nilai': formatRupiah(totalNilai) },
        { 'Keterangan': 'Diekspor Pada', 'Nilai': new Date().toLocaleString('id-ID') },
      ];

      const wsRingkasan = XLSX.utils.json_to_sheet(ringkasanRows);
      wsRingkasan['!cols'] = [{ wch: 28 }, { wch: 28 }];
      XLSX.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan');

      const fileName = `Pesanan_Apotek_JEC_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      alert('Gagal mengekspor data ke Excel.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // ── FITUR DOWNLOAD PDF ─────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!selectedOrder) return;
    setIsDownloading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentW = pageW - margin * 2;
      let y = 0;

      doc.setFillColor(34, 153, 84);
      doc.rect(0, 0, pageW, 30, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('INVOICE PESANAN', margin, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(220, 245, 230);
      doc.text('Apotek JEC', margin, 20);
      doc.text('Dicetak: ' + new Date().toLocaleString('id-ID'), margin, 25);

      y = 40;
      doc.setFillColor(247, 252, 249);
      doc.setDrawColor(210, 235, 220);
      doc.roundedRect(margin, y, contentW, 28, 3, 3, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text('Kode Pesanan', margin + 5, y + 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(34, 153, 84);
      doc.text(selectedOrder.kode_pesanan || '-', margin + 5, y + 14, { maxWidth: contentW * 0.5 - 10 });

      const statusText = selectedOrder.status || '-';
      let badgeRgb = [108, 117, 125];
      if (statusText === 'Menunggu Pengambilan') badgeRgb = [230, 168, 0];
      else if (statusText === 'Selesai') badgeRgb = [34, 153, 84];
      else if (statusText === 'Dibatalkan') badgeRgb = [220, 53, 69];

      doc.setFontSize(7.5);
      const badgeW = doc.getTextWidth(statusText) + 8;
      doc.setFillColor(...badgeRgb);
      doc.roundedRect(margin + 5, y + 18, badgeW, 6, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(statusText, margin + 5 + badgeW / 2, y + 22.2, { align: 'center' });

      const payConf = PAYMENT_STATUS_CONFIG[selectedOrder.payment_status];
      if (payConf) {
        const payText = payConf.emoji + ' ' + payConf.label;
        const payBadgeX = margin + 5 + badgeW + 6;
        let payRgb = [108, 117, 125];
        if (selectedOrder.payment_status === 'menunggu_konfirmasi') payRgb = [133, 100, 4];
        else if (selectedOrder.payment_status === 'lunas') payRgb = [21, 87, 36];
        doc.setFontSize(7.5);
        const payBadgeW = doc.getTextWidth(payText) + 8;
        doc.setFillColor(...payRgb);
        doc.roundedRect(payBadgeX, y + 18, payBadgeW, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(payText, payBadgeX + payBadgeW / 2, y + 22.2, { align: 'center' });
      }

      const rightX = margin + contentW - 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(selectedOrder.user_name || '-', rightX, y + 9, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(120, 120, 120);
      doc.text(selectedOrder.email || '-', rightX, y + 14.5, { align: 'right' });
      const tglStr = new Date(selectedOrder.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(tglStr, rightX, y + 22, { align: 'right' });
      y += 38;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      doc.text('Rincian Obat', margin, y);
      doc.setDrawColor(34, 153, 84);
      doc.setLineWidth(0.6);
      doc.line(margin, y + 2, margin + contentW, y + 2);
      y += 8;

      const itemsWithImages = await Promise.all(
        (selectedOrder.items || []).map(async (item) => {
          let base64 = null;
          if (item.image_url) {
            try { base64 = await getBase64ImageFromURL(`${IMG_URL}/${item.image_url}`); } catch (err) {}
          }
          return { ...item, base64 };
        })
      );

      autoTable(doc, {
        head: [['Gambar', 'Produk', 'Harga Satuan', 'Qty', 'Subtotal']],
        body: itemsWithImages.map(item => [
          '', item.nama_obat || '-',
          formatRupiah(item.harga_saat_pesan),
          'x' + item.quantity,
          formatRupiah(item.harga_saat_pesan * item.quantity)
        ]),
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: contentW,
        styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak', lineColor: [230, 230, 230], lineWidth: 0.2, textColor: [50, 50, 50], font: 'helvetica', valign: 'middle' },
        headStyles: { fillColor: [34, 153, 84], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left' },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center' },
          1: { cellWidth: contentW * 0.38 },
          2: { cellWidth: contentW * 0.20 },
          3: { cellWidth: contentW * 0.08, halign: 'center' },
          4: { cellWidth: contentW * 0.20, halign: 'right', fontStyle: 'bold' },
        },
        alternateRowStyles: { fillColor: [247, 252, 249] },
        bodyStyles: { fillColor: [255, 255, 255], minCellHeight: 16 },
        didDrawCell: function (data) {
          if (data.column.index === 0 && data.cell.section === 'body') {
            const rowData = itemsWithImages[data.row.index];
            if (rowData && rowData.base64) {
              const dim = 12;
              const xPos = data.cell.x + (data.cell.width - dim) / 2;
              const yPos = data.cell.y + (data.cell.height - dim) / 2;
              doc.addImage(rowData.base64, 'PNG', xPos, yPos, dim, dim);
            } else {
              doc.setFontSize(7);
              doc.setTextColor(150);
              doc.text("No Img", data.cell.x + 3, data.cell.y + 10);
            }
          }
        },
        theme: 'grid',
      });

      y = doc.lastAutoTable.finalY + 8;
      const summaryX = margin + contentW * 0.45;
      const summaryW = contentW * 0.55;
      const hasVoucher = selectedOrder.diskon_voucher > 0;
      const hasPoin = selectedOrder.diskon_poin > 0;
      const boxH = 16 + (hasVoucher ? 8 : 0) + (hasPoin ? 8 : 0) + 14;

      doc.setFillColor(247, 252, 249);
      doc.setDrawColor(210, 235, 220);
      doc.roundedRect(summaryX, y, summaryW, boxH, 3, 3, 'FD');
      let sy = y + 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('Total Harga Barang', summaryX + 6, sy);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
      doc.text(formatRupiah(selectedOrder.total_harga), summaryX + summaryW - 6, sy, { align: 'right' });
      sy += 8;

      if (hasVoucher) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 53, 69);
        doc.text('Diskon Voucher', summaryX + 6, sy);
        doc.setFont('helvetica', 'bold');
        doc.text('- ' + formatRupiah(selectedOrder.diskon_voucher), summaryX + summaryW - 6, sy, { align: 'right' });
        sy += 8;
      }
      if (hasPoin) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(220, 53, 69);
        doc.text('Potongan Poin', summaryX + 6, sy);
        doc.setFont('helvetica', 'bold');
        doc.text('- ' + formatRupiah(selectedOrder.diskon_poin), summaryX + summaryW - 6, sy, { align: 'right' });
        sy += 8;
      }

      doc.setDrawColor(200, 225, 210);
      doc.setLineWidth(0.4);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(summaryX + 5, sy - 2, summaryX + summaryW - 5, sy - 2);
      doc.setLineDashPattern([], 0);
      sy += 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text('Total Bayar', summaryX + 6, sy);
      doc.setTextColor(34, 153, 84);
      doc.text(formatRupiah(selectedOrder.total_bayar), summaryX + summaryW - 6, sy, { align: 'right' });

      doc.setFillColor(34, 153, 84);
      doc.rect(0, pageH - 14, pageW, 14, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(230, 250, 240);
      doc.text('Terima kasih atas kepercayaan Anda. Pesanan Anda akan diproses dengan aman dan cepat.', pageW / 2, pageH - 8, { align: 'center' });
      doc.text('Dokumen ini digenerate otomatis oleh sistem Apotek JEC.', pageW / 2, pageH - 4, { align: 'center' });

      doc.save(`Invoice_${selectedOrder.kode_pesanan}.pdf`);
    } catch (error) {
      alert("Terjadi kesalahan saat membuat PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── FITUR CETAK / PRINT ────────────────────────────────────────────
  const handlePrint = () => {
    if (!selectedOrder) return;
    const payConf = PAYMENT_STATUS_CONFIG[selectedOrder.payment_status];
    const printWindow = window.open('', '', 'height=800,width=800');
    const itemsHtml = selectedOrder.items.map(item => `
      <tr>
        <td>${item.nama_obat}</td>
        <td>${formatRupiah(item.harga_saat_pesan)}</td>
        <td style="text-align:center;">x${item.quantity}</td>
        <td style="text-align:right; font-weight:bold;">${formatRupiah(item.harga_saat_pesan * item.quantity)}</td>
      </tr>
    `).join('');
    const html = `
      <html>
        <head>
          <title>Print Pesanan - ${selectedOrder.kode_pesanan}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { border: 1px solid #ddd; padding: 30px; border-radius: 0 0 8px 8px; }
            .grid { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .badges { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
            .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8em; font-weight: bold; display: inline-block; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
            th { background-color: #f4fcf6; color: #28a745; }
            .total-box { margin-top: 20px; text-align: right; padding: 15px; border: 1px solid #eee; background: #fafafa; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0;">INVOICE PESANAN OBAT</h1>
            <p style="margin:5px 0 0 0;">Apotek JEC</p>
          </div>
          <div class="content">
            <div class="grid">
              <div>
                <h2 style="color: #28a745; margin:0;">${selectedOrder.kode_pesanan}</h2>
                <div class="badges">
                  <span class="badge" style="background:#f0f0f0; color:#555;">Status: ${selectedOrder.status}</span>
                  <span class="badge" style="background:${payConf?.bg || '#eee'}; color:${payConf?.color || '#555'}; border: 1px solid ${payConf?.border || '#ccc'};">
                    ${payConf?.emoji || ''} ${payConf?.label || selectedOrder.payment_status}
                  </span>
                </div>
              </div>
              <div style="text-align:right;">
                <p style="margin:0; font-weight:bold;">${selectedOrder.user_name}</p>
                <p style="margin:5px 0 0 0; font-size:0.9em; color:#666;">${new Date(selectedOrder.created_at).toLocaleString('id-ID')}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr><th>Produk Obat</th><th>Harga Satuan</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Subtotal</th></tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>
            <div class="total-box">
              <p style="margin: 0 0 5px 0;">Total Harga Barang: <strong>${formatRupiah(selectedOrder.total_harga)}</strong></p>
              ${selectedOrder.diskon_voucher > 0 ? `<p style="margin: 0 0 5px 0; color: #dc3545;">Diskon Voucher: <strong>- ${formatRupiah(selectedOrder.diskon_voucher)}</strong></p>` : ''}
              ${selectedOrder.diskon_poin > 0 ? `<p style="margin: 0 0 5px 0; color: #dc3545;">Potongan Poin: <strong>- ${formatRupiah(selectedOrder.diskon_poin)}</strong></p>` : ''}
              <hr style="border-top:1px dashed #ccc; margin:10px 0;">
              <h3 style="margin: 0; color: #28a745;">Total Bayar: ${formatRupiah(selectedOrder.total_bayar)}</h3>
            </div>
            <p style="text-align:center; margin-top:40px; font-size: 0.9em; color: #777;">Terima kasih. Pesanan Anda akan diproses setelah pembayaran diverifikasi.</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  // ── FILTER & SEARCH ───────────────────────────────────────────────
  const filteredData = pesananData.filter(item => {
    const term = searchTerm.toLowerCase();
    const kode = item.kode_pesanan ? item.kode_pesanan.toLowerCase() : '';
    const user = item.user_name ? item.user_name.toLowerCase() : '';
    const matchSearch = kode.includes(term) || user.includes(term);
    const matchPayment = filterPayment === 'semua' || item.payment_status === filterPayment;
    return matchSearch && matchPayment;
  });

  const jumlahMenungguKonfirmasi = pesananData.filter(i => i.payment_status === 'menunggu_konfirmasi').length;

  // ── BADGE HELPERS ─────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    let color = '#6c757d';
    if (status === 'Menunggu Pengambilan') color = '#17a2b8';
    else if (status === 'Selesai') color = '#28a745';
    else if (status === 'Dibatalkan') color = '#dc3545';
    else if (status === 'Menunggu Pembayaran') color = '#f39c12';
    return (
      <span style={{
        backgroundColor: color, color: '#fff',
        padding: '4px 10px', borderRadius: '20px',
        fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.3px'
      }}>
        {status}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus) => {
    const conf = PAYMENT_STATUS_CONFIG[paymentStatus] || {
      label: paymentStatus, color: '#6c757d', bg: '#f8f9fa', border: '#dee2e6', emoji: '❓'
    };
    return (
      <span style={{
        backgroundColor: conf.bg, color: conf.color,
        border: `1px solid ${conf.border}`,
        padding: '4px 10px', borderRadius: '20px',
        fontSize: '0.75rem', fontWeight: '600',
        display: 'inline-flex', alignItems: 'center', gap: '4px'
      }}>
        {conf.emoji} {conf.label}
      </span>
    );
  };

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const UserAvatar = ({ profileImage, name }) => {
    const [imgError, setImgError] = useState(false);
    const avatarStyle = {
      width: '72px', height: '72px', borderRadius: '50%',
      border: '3px solid #e8f5e9', boxShadow: '0 2px 8px rgba(40,167,69,0.2)',
    };
    if (profileImage && !imgError) {
      return (
        <img
          src={`${IMG_URL}/${profileImage}`}
          alt={name}
          crossOrigin="anonymous"
          style={{ ...avatarStyle, objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      );
    }
    return (
      <div style={{
        ...avatarStyle,
        background: 'linear-gradient(135deg, #28a745, #20c997)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: '700', fontSize: '1.3rem', userSelect: 'none'
      }}>
        {getInitials(name)}
      </div>
    );
  };

  const PaymentActionButton = ({ pesanan, onUpdate, isLoading, stopPropagation = false }) => {
    const conf = PAYMENT_STATUS_CONFIG[pesanan.payment_status];
    if (!conf || !conf.nextAction) return null;
    return (
      <button
        onClick={(e) => {
          if (stopPropagation) e.stopPropagation();
          onUpdate(pesanan.pesanan_id, conf.nextAction, e);
        }}
        disabled={isLoading}
        style={{
          width: '100%', padding: '8px 12px',
          backgroundColor: isLoading ? '#ccc' : conf.nextColor,
          color: '#fff', border: 'none', borderRadius: '8px',
          fontSize: '0.8rem', fontWeight: '700',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          marginTop: '8px', transition: 'opacity 0.2s',
          boxShadow: '0 2px 6px rgba(40,167,69,0.25)',
        }}
      >
        {isLoading ? '⏳ Memproses...' : conf.nextLabel}
      </button>
    );
  };

  return (
    <div className="crud-page">

      {/* ── Header ── */}
      <div className="crud-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <h1 style={{ margin: 0 }}>Data Pesanan Masuk</h1>
          
          {/* ── BUNGKUS KHUSUS UNTUK MENDEKATKAN BADGE KUNING & NOTIFIKASI TOAST ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {jumlahMenungguKonfirmasi > 0 && (
              <span style={{
                backgroundColor: '#ffc107', color: '#856404',
                border: '1px solid #ffc107', borderRadius: '20px',
                padding: '4px 12px', fontSize: '0.8rem', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '5px',
                animation: 'pulse 1.5s ease-in-out infinite',
                boxShadow: '0 0 0 0 rgba(255,193,7,0.4)',
              }}>
                🔔 {jumlahMenungguKonfirmasi} Menunggu Konfirmasi
              </span>
            )}

            {/* Notifikasi Toast Inline */}
            {toastNotif && (
              <div className="pesanan-notif-inline">
                <div className="pesanan-toast-icon">💳</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#856404' }}>{toastNotif.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>{toastNotif.desc}</p>
                </div>
                <button className="pesanan-toast-close" onClick={() => setToastNotif(null)}>&times;</button>
              </div>
            )}
            
          </div>
          {/* ── SELESAI BUNGKUS KHUSUS ── */}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', width: '100%', maxWidth: '650px' }}>
          <input
            type="text"
            placeholder="Cari Kode Pesanan / Nama User..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1, minWidth: '200px', height: '42px',
              padding: '0 15px', borderRadius: '8px',
              border: '1px solid #ddd', boxSizing: 'border-box'
            }}
          />

          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            style={{
              height: '42px', padding: '0 15px', borderRadius: '8px',
              border: '1px solid #ddd', fontSize: '0.875rem', cursor: 'pointer',
              backgroundColor: filterPayment === 'menunggu_konfirmasi' ? '#fff3cd' : '#fff',
              color: filterPayment === 'menunggu_konfirmasi' ? '#856404' : '#333',
              fontWeight: filterPayment !== 'semua' ? '600' : '400',
              boxSizing: 'border-box'
            }}
          >
            <option value="semua">Semua Status Bayar</option>
            <option value="belum_bayar">⏳ Belum Bayar</option>
            <option value="menunggu_konfirmasi">🔔 Menunggu Konfirmasi</option>
            <option value="lunas">✅ Lunas</option>
          </select>

          <button
            onClick={handleExportExcel}
            title="Export ke Excel"
            disabled={isExporting || loading || filteredData.length === 0}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '42px', height: '42px', padding: '0', flexShrink: 0,
              backgroundColor: isExporting ? '#5a9e6f' : '#1D6F42',
              color: '#fff', border: 'none', borderRadius: '8px',
              cursor: (isExporting || loading || filteredData.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (isExporting || loading || filteredData.length === 0) ? 0.65 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(29,111,66,0.30)',
              boxSizing: 'border-box'
            }}
          >
            {isExporting ? (
              <span style={{ fontSize: '12px' }}>⏳</span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 13H16M8 17H16M10 9H14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {!loading && (
        <p style={{ fontSize: '0.82rem', color: '#888', margin: '0 0 16px 0', paddingLeft: '2px' }}>
          Menampilkan <strong style={{ color: '#28a745' }}>{filteredData.length}</strong> pesanan
          {searchTerm && ` untuk pencarian "${searchTerm}"`}
          {filterPayment !== 'semua' && ` · Filter: ${PAYMENT_STATUS_CONFIG[filterPayment]?.label || filterPayment}`}
        </p>
      )}

      {/* ── Card Grid ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: '1rem' }}>
          ⏳ Memuat data pesanan...
        </div>
      ) : filteredData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#aaa', fontSize: '0.95rem' }}>
          Tidak ada data pesanan ditemukan.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '20px', padding: '10px 0 30px 0'
        }}>
          {filteredData.map((item) => {
            const isMenunggu = item.payment_status === 'menunggu_konfirmasi';
            const isMenungguPengambilan = item.status === 'Menunggu Pengambilan';

            return (
              <div
                key={item.pesanan_id}
                onClick={() => handleViewDetail(item.pesanan_id)}
                style={{
                  backgroundColor: '#fff', borderRadius: '14px',
                  boxShadow: isMenunggu
                    ? '0 2px 12px rgba(255,193,7,0.35)'
                    : isMenungguPengambilan
                      ? '0 2px 12px rgba(23,162,184,0.3)'
                      : '0 2px 12px rgba(0,0,0,0.08)',
                  border: isMenunggu
                    ? '2px solid #ffc107'
                    : isMenungguPengambilan
                      ? '2px solid #17a2b8'
                      : '1px solid #e8f5e9',
                  cursor: 'pointer',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', position: 'relative',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{
                  width: '100%',
                  background: isMenunggu
                    ? 'linear-gradient(135deg, #f39c12, #e67e22)'
                    : isMenungguPengambilan
                      ? 'linear-gradient(135deg, #17a2b8, #138496)'
                      : 'linear-gradient(135deg, #28a745, #20c997)',
                  padding: '10px 14px', textAlign: 'center', position: 'relative',
                }}>
                  <span style={{
                    color: '#fff', fontWeight: '700',
                    fontSize: '0.85rem', letterSpacing: '0.5px', fontFamily: 'monospace'
                  }}>
                    {item.kode_pesanan}
                  </span>
                  {(isMenunggu || isMenungguPengambilan) && (
                    <span style={{
                      position: 'absolute', top: '8px', right: '10px',
                      width: '10px', height: '10px',
                      backgroundColor: '#fff', borderRadius: '50%',
                      boxShadow: '0 0 0 2px rgba(255,255,255,0.5)',
                      animation: 'blink 1s step-start infinite',
                    }} />
                  )}
                </div>

                <div style={{ padding: '18px 14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <UserAvatar profileImage={item.profile_image} name={item.user_name} />
                  </div>

                  <p style={{
                    margin: '0 0 4px 0', fontWeight: '700', fontSize: '0.95rem',
                    color: '#2d2d2d', textAlign: 'center',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px'
                  }}>
                    {item.user_name}
                  </p>

                  <div style={{ marginBottom: '6px' }}>{getStatusBadge(item.status)}</div>
                  <div style={{ marginBottom: '10px' }}>{getPaymentStatusBadge(item.payment_status)}</div>

                  <div style={{ width: '100%', height: '1px', backgroundColor: '#f0f0f0', margin: '6px 0' }} />

                  <p style={{ margin: '8px 0 4px 0', fontWeight: '800', fontSize: '1rem', color: '#28a745', textAlign: 'center' }}>
                    {formatRupiah(item.total_bayar)}
                  </p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#aaa', textAlign: 'center' }}>
                    {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>

                  <div style={{ width: '100%', height: '1px', backgroundColor: '#f0f0f0', margin: '0 0 10px 0' }} />

                  <div style={{ display: 'flex', gap: '8px', marginBottom: (isMenunggu || isMenungguPengambilan) ? '8px' : '14px', width: '100%', justifyContent: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewDetail(item.pesanan_id); }}
                      style={{
                        flex: 1, padding: '7px 0',
                        backgroundColor: '#20c997', border: 'none',
                        borderRadius: '8px', color: '#fff',
                        fontSize: '0.8rem', fontWeight: '600',
                        cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      📄 Detail
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.pesanan_id, e)}
                      style={{
                        flex: 1, padding: '7px 0',
                        backgroundColor: '#dc3545', border: 'none',
                        borderRadius: '8px', color: '#fff',
                        fontSize: '0.8rem', fontWeight: '600',
                        cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      🗑️ Hapus
                    </button>
                  </div>

                  {isMenunggu && (
                    <div style={{ width: '100%', paddingBottom: '14px' }}>
                      <PaymentActionButton
                        pesanan={item}
                        onUpdate={handleUpdatePaymentStatus}
                        isLoading={updatingPayment}
                        stopPropagation={true}
                      />
                    </div>
                  )}

                  {isMenungguPengambilan && (
                    <div style={{ width: '100%', paddingBottom: '14px' }}>
                      <button
                        onClick={(e) => handleCompleteOrder(item.pesanan_id, e)}
                        disabled={updatingPayment}
                        style={{
                          width: '100%', padding: '8px 12px',
                          backgroundColor: '#17a2b8', color: '#fff',
                          border: 'none', borderRadius: '8px',
                          fontSize: '0.8rem', fontWeight: '700',
                          cursor: updatingPayment ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          boxShadow: '0 2px 6px rgba(23,162,184,0.25)',
                        }}
                      >
                        {updatingPayment ? '⏳ Memproses...' : '🛍️ Serahkan Obat'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Detail ── */}
      {isDetailOpen && (
        <div
          className="modal-overlay"
          onClick={closeDetailModal}
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff', borderRadius: '12px',
              maxWidth: '750px', width: '95%',
              display: 'flex', flexDirection: 'column',
              maxHeight: '90vh', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid #eee', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Detail Pesanan</h2>
              <button onClick={closeDetailModal} disabled={isDownloading} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: isDownloading ? 'not-allowed' : 'pointer', color: '#888' }}>&times;</button>
            </div>

            <div className="modal-body" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {loadingDetail || !selectedOrder ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Sedang memuat detail pesanan...</div>
              ) : (
                <>
                  <div style={{ marginBottom: '25px', backgroundColor: '#f4fcf6', border: '1px solid #d1ebd8', padding: '20px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', color: '#777', margin: '0 0 5px 0' }}>Kode Pesanan</p>
                        <h3 style={{ margin: '0 0 10px 0', color: '#28a745', fontSize: '1.4rem' }}>{selectedOrder.kode_pesanan}</h3>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {getStatusBadge(selectedOrder.status)}
                          {getPaymentStatusBadge(selectedOrder.payment_status)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333', fontSize: '1.1rem' }}>{selectedOrder.user_name}</p>
                        <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 5px 0' }}>{selectedOrder.email || '-'}</p>
                        <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>{new Date(selectedOrder.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.status === 'Menunggu Pengambilan' && (
                    <div style={{
                      marginBottom: '20px', backgroundColor: '#e0f3f8',
                      border: '2px solid #17a2b8', borderRadius: '10px',
                      padding: '16px 20px', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
                    }}>
                      <div>
                        <h4 style={{ margin: 0, color: '#0c5460', fontSize: '1rem' }}>🛍️ Pasien Siap Mengambil Obat</h4>
                        <p style={{ margin: '4px 0 0', color: '#0c5460', fontSize: '0.85rem' }}>Tekan tombol selesaikan jika Anda sudah menyerahkan obat fisik kepada pasien.</p>
                      </div>
                      <button
                        onClick={() => handleCompleteOrder(selectedOrder.pesanan_id)}
                        disabled={updatingPayment}
                        style={{
                          padding: '10px 18px', backgroundColor: '#17a2b8', color: '#fff',
                          border: 'none', borderRadius: '8px', fontWeight: 'bold',
                          cursor: updatingPayment ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {updatingPayment ? 'Memproses...' : 'Selesaikan Pesanan'}
                      </button>
                    </div>
                  )}

                  <div style={{
                    marginBottom: '25px',
                    border: selectedOrder.payment_status === 'menunggu_konfirmasi' ? '2px solid #ffc107' : '1px solid #e0e0e0',
                    borderRadius: '10px', overflow: 'hidden',
                  }}>
                    <div style={{
                      backgroundColor: selectedOrder.payment_status === 'menunggu_konfirmasi' ? '#fff3cd' : '#f8f9fa',
                      padding: '14px 20px', borderBottom: '1px solid #e0e0e0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '10px',
                    }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: '#333' }}>Status Pembayaran</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                          {selectedOrder.payment_status === 'menunggu_konfirmasi'
                            ? '⚠️ User sudah klik "Saya Sudah Bayar". Mohon verifikasi dan konfirmasi.'
                            : 'Kelola status pembayaran pesanan ini.'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {getPaymentStatusBadge(selectedOrder.payment_status)}
                      </div>
                    </div>

                    <div style={{ padding: '16px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: '600' }}>Ubah ke:</span>
                      {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, conf]) => {
                        const isCurrent = selectedOrder.payment_status === key;
                        return (
                          <button
                            key={key}
                            onClick={() => !isCurrent && handleUpdatePaymentStatus(selectedOrder.pesanan_id, key)}
                            disabled={isCurrent || updatingPayment}
                            style={{
                              padding: '7px 14px', borderRadius: '8px',
                              border: `1px solid ${isCurrent ? conf.border : '#ddd'}`,
                              backgroundColor: isCurrent ? conf.bg : '#fff',
                              color: isCurrent ? conf.color : '#555',
                              fontSize: '0.8rem',
                              fontWeight: isCurrent ? '700' : '500',
                              cursor: (isCurrent || updatingPayment) ? 'not-allowed' : 'pointer',
                              opacity: updatingPayment && !isCurrent ? 0.6 : 1,
                              transition: 'all 0.15s',
                              display: 'flex', alignItems: 'center', gap: '5px',
                            }}
                          >
                            {conf.emoji} {conf.label}
                            {isCurrent && <span style={{ fontSize: '0.7rem' }}>✓</span>}
                          </button>
                        );
                      })}
                      {updatingPayment && <span style={{ fontSize: '0.8rem', color: '#888' }}>⏳ Memproses...</span>}
                    </div>
                  </div>

                  <h4 style={{ color: '#444', marginBottom: '15px', borderBottom: '2px solid #28a745', display: 'inline-block', paddingBottom: '5px' }}>Rincian Obat</h4>

                  <div style={{ marginBottom: '25px', overflowX: 'auto', borderRadius: '8px', border: '1px solid #eee' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#28a745', color: '#fff' }}>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Produk</th>
                          <th style={{ padding: '12px', textAlign: 'left' }}>Harga Satuan</th>
                          <th style={{ padding: '12px', textAlign: 'center' }}>Qty</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                  src={`${IMG_URL}/${item.image_url}`}
                                  alt="obat"
                                  crossOrigin="anonymous"
                                  style={{ width: '45px', height: '45px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#fff' }}
                                  onError={(e) => { e.target.src = 'https://via.placeholder.com/45?text=No+Img'; }}
                                />
                                <span style={{ fontWeight: '600', color: '#444', fontSize: '0.95rem' }}>{item.nama_obat}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px', color: '#555' }}>{formatRupiah(item.harga_saat_pesan)}</td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>x {item.quantity}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#333' }}>{formatRupiah(item.harga_saat_pesan * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ backgroundColor: '#fdfdfd', padding: '20px', borderRadius: '10px', border: '1px solid #e0e0e0', marginLeft: 'auto', width: '100%', maxWidth: '350px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ color: '#666' }}>Total Harga Barang</span>
                      <span style={{ fontWeight: '600', color: '#444' }}>{formatRupiah(selectedOrder.total_harga)}</span>
                    </div>
                    {selectedOrder.diskon_voucher > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#dc3545' }}>
                        <span>Diskon Voucher</span>
                        <span style={{ fontWeight: '500' }}>- {formatRupiah(selectedOrder.diskon_voucher)}</span>
                      </div>
                    )}
                    {selectedOrder.diskon_poin > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#dc3545' }}>
                        <span>Potongan Poin</span>
                        <span style={{ fontWeight: '500' }}>- {formatRupiah(selectedOrder.diskon_poin)}</span>
                      </div>
                    )}
                    <div style={{ borderTop: '2px dashed #ccc', margin: '15px 0' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333' }}>Total Bayar</span>
                      <span style={{ fontWeight: 'bold', fontSize: '1.4rem', color: '#28a745' }}>{formatRupiah(selectedOrder.total_bayar)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', justifyContent: 'flex-end', backgroundColor: '#fafafa', borderRadius: '0 0 12px 12px', flexWrap: 'wrap' }}>
              <button type="button" onClick={closeDetailModal} disabled={isDownloading} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#fff', color: '#555', cursor: isDownloading ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                Kembali
              </button>
              <button type="button" onClick={handlePrint} disabled={loadingDetail || !selectedOrder || isDownloading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#17a2b8', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: (loadingDetail || !selectedOrder || isDownloading) ? 'not-allowed' : 'pointer' }}>
                🖨️ Print
              </button>
              <button type="button" onClick={handleDownloadPDF} disabled={loadingDetail || !selectedOrder || isDownloading} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#28a745', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: (loadingDetail || !selectedOrder || isDownloading) ? 'not-allowed' : 'pointer', opacity: (loadingDetail || !selectedOrder || isDownloading) ? 0.6 : 1 }}>
                {isDownloading ? <span>⏳ Menyusun...</span> : <><span>📥</span> Cetak PDF</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSS Animasi ── */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .pesanan-notif-inline {
          background: #fff;
          border-left: 4px solid #ffc107;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          padding: 6px 12px;
          display: flex; align-items: center; gap: 10px;
          animation: slideInRight 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
          font-family: 'Plus Jakarta Sans', sans-serif;
          white-space: nowrap;
        }
        .pesanan-toast-icon {
          background: #fff3cd; width: 28px; height: 28px;
          border-radius: 50%; display: flex; align-items: center;
          justify-content: center; font-size: 0.9rem; flex-shrink: 0;
        }
        .pesanan-toast-close {
          background: transparent; border: none; font-size: 1.2rem;
          color: #aaa; cursor: pointer; padding: 0 0 0 5px; line-height: 1; transition: color 0.2s;
        }
        .pesanan-toast-close:hover { color: #333; }
      `}</style>
    </div>
  );
}

export default Pesanan;