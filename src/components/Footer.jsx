// path: src/components/Footer.jsx
// Cara pakai: import Footer from '../components/Footer'
// Lalu taruh <Footer /> di bawah <Outlet /> dalam AdminLayout.jsx

import React from 'react';
import '../css/style.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="admin-footer">
      <div className="admin-footer-inner">
        
        {/* Copyright */}
        <div className="footer-copy">
          <span>© {currentYear} <strong>Jakarta Eye Center</strong>. All rights reserved.</span>
        </div>

      </div>
    </footer>
  );
}

export default Footer;