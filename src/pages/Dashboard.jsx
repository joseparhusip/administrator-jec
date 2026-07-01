// path: src/pages/admin/Dashboard.jsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import '../css/style.css';

// ✅ FIX #1: Gunakan fallback URL agar tidak pernah undefined
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api-backend-jec.jakartaeyecenter.site';

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0, totalRS: 0, totalObat: 0, totalCoin: 0, totalCart: 0,
    totalPromo: 0, totalTestimoni: 0, totalVideos: 0, totalEvent: 0, totalJournal: 0
  });

  const [loginActivity, setLoginActivity] = useState([]);
  const [userList, setUserList] = useState([]);
  const [selectedChartUser, setSelectedChartUser] = useState('all');
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [topServices, setTopServices] = useState([]);

  // ── STATE NOTIFIKASI & AUDIO ──
  const [toastNotif, setToastNotif] = useState(null);
  const notifAudioRef = useRef(null);
  const notifiedIdsRef = useRef(new Set());
  const isPendingRef = useRef(false);

  // Warna chart
  const lineColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a28dff', '#ff6b9d', '#4ecdc4', '#f39c12', '#e74c3c', '#3498db'];
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getGreetingTime = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 11) return "Pagi";
    if (currentHour >= 11 && currentHour < 15) return "Siang";
    if (currentHour >= 15 && currentHour < 19) return "Sore";
    return "Malam";
  };

  const getDayName = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date().getDay()];
  };

  const formatDateTimeIndo = (dateInput) => {
    const date = new Date(dateInput);
    const day = date.getDate();
    const month = date.toLocaleDateString('id-ID', { month: 'long' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
    return `${day} ${month} ${year}, ${time}`;
  };

  const timeAgo = (dateInput) => {
    const date = new Date(dateInput);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}d lalu`;
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "thn lalu";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "bln lalu";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "h lalu";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "j lalu";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m lalu";
    return "Baru saja";
  };

  // ── INISIALISASI AUDIO ──
  // ✅ Fix autoplay: browser hanya izinkan audio setelah user interaction
  const userHasInteracted = useRef(false);

  useEffect(() => {
    const markInteracted = () => { userHasInteracted.current = true; };
    document.addEventListener('click', markInteracted, { once: true });
    document.addEventListener('keydown', markInteracted, { once: true });

    const audio = new Audio('/src/assets/voice/dashboard_masuk.mp3');
    audio.volume = 1.0;
    
    const handleEnded = () => {
        if (isPendingRef.current && userHasInteracted.current) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
        }
    };
    
    audio.addEventListener('ended', handleEnded);
    notifAudioRef.current = audio;

    return () => {
        document.removeEventListener('click', markInteracted);
        document.removeEventListener('keydown', markInteracted);
        audio.removeEventListener('ended', handleEnded);
        audio.pause();
        audio.src = '';
    };
  }, []);

  // ── LOGIC PLAY/PAUSE AUDIO ──
  useEffect(() => {
    isPendingRef.current = pendingActions.length > 0;
    
    if (pendingActions.length > 0) {
        // ✅ Fix: hanya play jika user sudah interact dengan halaman
        if (notifAudioRef.current && notifAudioRef.current.paused && userHasInteracted.current) {
            notifAudioRef.current.play().catch(() => {});
        }
    } else {
        if (notifAudioRef.current && !notifAudioRef.current.paused) {
            notifAudioRef.current.pause();
            notifAudioRef.current.currentTime = 0;
            setToastNotif(null); 
        }
    }
  }, [pendingActions]);

  // ── FETCH DATA ──
  // ✅ FIX #2: Gunakan API_BASE yang sudah benar
  const fetchDashboardData = useCallback(async (isInitial = false) => {
    const token = localStorage.getItem('adminToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    const baseUrl = `${API_BASE}/api/admin/beranda`;  // ✅ prefix /api/admin/beranda

    try {
      // Polling HANYA untuk pending actions
      const pendingRes = await fetch(`${baseUrl}/pending-actions`, { headers });

      // ✅ FIX #3: Cek content-type sebelum parse JSON agar tidak crash saat server error
      const pendingContentType = pendingRes.headers.get('content-type') || '';
      if (!pendingRes.ok || !pendingContentType.includes('application/json')) {
        console.error(`[Dashboard] Pending actions error: ${pendingRes.status} ${pendingRes.statusText}`);
      } else {
        const pendingData = await pendingRes.json();
        if (pendingData.success) {
          const newData = pendingData.data;
          
          setPendingActions(() => {
              const brandNewItems = newData.filter(
                  item => !notifiedIdsRef.current.has(`${item.type}-${item.action_id}`)
              );

              if (brandNewItems.length > 0) {
                  brandNewItems.forEach(item => notifiedIdsRef.current.add(`${item.type}-${item.action_id}`));
                  setToastNotif({
                      title: 'Pemberitahuan Baru!',
                      desc: `Ada ${brandNewItems.length} antrean baru (Lasik/Flacs/Obat).`
                  });
              }

              if (newData.length === 0) {
                  notifiedIdsRef.current.clear();
              }
              return newData;
          });
        }
      }

      // Fetch sisanya hanya saat render pertama
      if (isInitial) {
        const [statsRes, loginRes, recentRes, topRes] = await Promise.all([
            fetch(`${baseUrl}/stats`, { headers }),
            fetch(`${baseUrl}/login-activity`, { headers }),
            fetch(`${baseUrl}/recent-activity`, { headers }),
            fetch(`${baseUrl}/top-services`, { headers })
        ]);

        // ✅ FIX #4: Safe JSON parsing untuk setiap response
        const safeJson = async (res) => {
          const ct = res.headers.get('content-type') || '';
          if (!res.ok || !ct.includes('application/json')) {
            console.error(`[Dashboard] HTTP ${res.status} pada ${res.url}`);
            return null;
          }
          return res.json();
        };

        const statsData = await safeJson(statsRes);
        if (statsData?.success) setStats(statsData.data);

        const loginData = await safeJson(loginRes);
        if (loginData?.success) {
          setLoginActivity(loginData.data.chartData || []);
          setUserList(loginData.data.userList || []);
        }

        const recentData = await safeJson(recentRes);
        if (recentData?.success) setRecentActivities(recentData.data);

        const topData = await safeJson(topRes);
        if (topData?.success) setTopServices(topData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(true);
    const interval = setInterval(() => fetchDashboardData(false), 5000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleNavigateToDetail = (type, actionId) => {
    if (!actionId) return;
    if (type.toLowerCase() === 'lasik') {
      navigate('/layanan/lasik', { state: { openDetailId: actionId } });
    } else if (type.toLowerCase() === 'flacs') {
      navigate('/layanan/flacs', { state: { openDetailId: actionId } });
    } else if (type.toLowerCase() === 'obat') {
      navigate('/pesanan', { state: { openDetailId: actionId } });
    }
  };

  const renderActivityItem = (activity, index) => {
    let markerClass = "marker-default";
    let message = "";

    switch (activity.type) {
      case 'register':
        markerClass = "marker-register";
        message = <><strong>{activity.user_name}</strong> baru saja mendaftar ke sistem.</>;
        break;
      case 'lasik':
        markerClass = "marker-lasik";
        message = <><strong>{activity.user_name}</strong> membuat jadwal untuk <strong>{activity.detail}</strong>.</>;
        break;
      case 'flacs':
        markerClass = "marker-flacs";
        message = <><strong>{activity.user_name}</strong> membuat jadwal untuk <strong>{activity.detail}</strong>.</>;
        break;
      case 'obat':
        markerClass = "marker-obat";
        message = <><strong>{activity.user_name}</strong> melakukan pemesanan <strong>{activity.detail}</strong>.</>;
        break;
      default:
        message = <><strong>{activity.user_name}</strong> melakukan aktivitas baru.</>;
    }

    return (
      <li key={`${activity.type}-${index}`} className="timeline-item">
        <div className={`timeline-marker ${markerClass}`}></div>
        <div className="timeline-content">
          <span className="timeline-text">{message}</span>
          <span className="timeline-time">{timeAgo(activity.created_at)}</span>
        </div>
      </li>
    );
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-text">
          <h1>Admin Dashboard</h1>
          <p>Selamat datang di Admin JEC!</p>
          
          {/* NOTIFIKASI INLINE BADGE & TOAST */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
            {pendingActions.length > 0 && (
                <span className="dashboard-badge-pulse">
                    🔔 {pendingActions.length} Menunggu Persetujuan
                </span>
            )}
            
            {toastNotif && (
                <div className="dashboard-notif-inline">
                    <div className="dashboard-toast-icon">🚀</div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#14a058' }}>{toastNotif.title}</h4>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>{toastNotif.desc}</p>
                    </div>
                    <button className="dashboard-toast-close" onClick={() => setToastNotif(null)}>&times;</button>
                </div>
            )}
          </div>

        </div>
        <div className="header-greeting">
          <p>Selamat {getGreetingTime()} di hari {getDayName()}, Admin JEC! 🚀</p>
        </div>
      </div>

      <div className="alert-card">
        <span>⚠️</span>
        <p>Jangan lupa untuk selalu mengecek data pengguna baru, daftar booking, dan obat.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon users">👤</div><div className="stat-info"><h3>Total Pengguna</h3><p>{stats.totalUsers.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon rs">🏥</div><div className="stat-info"><h3>Total Rumah Sakit</h3><p>{stats.totalRS.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon obat">💊</div><div className="stat-info"><h3>Total Obat</h3><p>{stats.totalObat.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon coin">💰</div><div className="stat-info"><h3>Total Coin User</h3><p>{stats.totalCoin.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon cart">🛒</div><div className="stat-info"><h3>Item di Cart</h3><p>{stats.totalCart.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon promo">🏷️</div><div className="stat-info"><h3>Total Promo</h3><p>{stats.totalPromo.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon testimoni">🌟</div><div className="stat-info"><h3>Total Testimoni</h3><p>{stats.totalTestimoni.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon videos">▶️</div><div className="stat-info"><h3>Total Videos</h3><p>{stats.totalVideos.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon event">🗓️</div><div className="stat-info"><h3>Total Event</h3><p>{stats.totalEvent.toLocaleString('id-ID')}</p></div></div>
        <div className="stat-card"><div className="stat-icon journals">📚</div><div className="stat-info"><h3>Total Journals</h3><p>{stats.totalJournal.toLocaleString('id-ID')}</p></div></div>
      </div>

      <div className="dashboard-row-layout">
        <div className="content-area" style={{ flex: 1.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Menunggu Persetujuan</h2>
          </div>
          
          <ul className="pending-list">
            {pendingActions.length > 0 ? (
              pendingActions.map((action, index) => {
                const tagClass = action.type.toLowerCase() === 'lasik' ? 'tag-lasik' : 
                                 action.type.toLowerCase() === 'flacs' ? 'tag-flacs' : 
                                 action.type.toLowerCase() === 'obat' ? 'tag-obat' : 'tag-default';
                
                return (
                  <li key={`pending-${index}`} className="pending-item">
                    <div className="pending-info">
                      <div className="pending-header">
                        <span className={`badge-tag ${tagClass}`}>{action.type}</span>
                        <span className="pending-user">{action.name}</span>
                      </div>
                      <span className="pending-invoice">{action.invoice}</span>
                      <span className="pending-time">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '2px'}}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        {formatDateTimeIndo(action.created_at)}
                      </span>
                    </div>
                    <button 
                      className="btn-proses" 
                      onClick={() => handleNavigateToDetail(action.type, action.action_id)}
                    >
                      Proses ➔
                    </button>
                  </li>
                );
              })
            ) : (
              <li style={{ textAlign: 'center', color: '#888', padding: '1.5rem 0' }}>Tidak ada antrean yang menunggu persetujuan.</li>
            )}
          </ul>
        </div>

        <div className="chart-container" style={{ flex: 1 }}>
          <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, border: 'none', padding: 0, textAlign: 'center' }}>Obat Terpopuler</h2>
          </div>
          
          {topServices.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={topServices} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => `${name}`}>
                  {topServices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#888', marginTop: '2rem' }}>Belum ada data obat terjual.</div>
          )}
        </div>
      </div>

      <div className="dashboard-row-layout">
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ margin: 0, borderBottom: 'none', paddingBottom: 0 }}>Aktivitas Login Mingguan</h2>
            {userList.length > 0 && (
              <select 
                className="filter-dropdown"
                style={{ padding: '8px 12px', minWidth: '220px', width: 'auto', minHeight: '38px' }}
                value={selectedChartUser}
                onChange={(e) => setSelectedChartUser(e.target.value)}
              >
                <option value="all">Semua Top 10 Users</option>
                {userList.map((user) => (
                  <option key={user.userId} value={user.dataKey}>
                    {user.username} ({user.totalLogins} login)
                  </option>
                ))}
              </select>
            )}
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={loginActivity} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-dark)" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {userList
                .filter(user => selectedChartUser === 'all' || user.dataKey === selectedChartUser)
                .map((user) => {
                  const originalIndex = userList.findIndex(u => u.userId === user.userId);
                  return (
                    <Line 
                      key={user.userId}
                      type="monotone" 
                      dataKey={user.dataKey}
                      name={user.username}
                      stroke={lineColors[originalIndex % lineColors.length]}
                      strokeWidth={selectedChartUser === 'all' ? 2 : 3}
                      activeDot={{ r: 6 }}
                      dot={{ r: 3 }}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="content-area">
          <h2>Aktivitas Terbaru</h2>
          <div className="timeline-wrapper">
            <ul className="timeline-list">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => renderActivityItem(activity, index))
              ) : (
                <li style={{ color: '#888', padding: '0.9rem 0' }}>
                  Belum ada aktivitas terbaru hari ini.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;