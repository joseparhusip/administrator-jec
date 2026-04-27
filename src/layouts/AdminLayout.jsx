// path: src/layouts/AdminLayout.jsx

import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'   // ⭐ Import Footer
import '../css/style.css'

const HamburgerIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      
      <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* ⭐ Bungkus konten + footer dalam satu wrapper */}
      <div className="admin-content-wrapper">
        <main className="admin-content">
          
          {!isSidebarOpen && (
            <button onClick={toggleSidebar} className="sidebar-open-btn" aria-label="Buka menu">
              <HamburgerIcon />
            </button>
          )}
          
          <Outlet />
        </main>

        {/* ⭐ Footer di sini — otomatis muncul di semua halaman */}
        <Footer />
      </div>

    </div>
  )
}

export default AdminLayout;