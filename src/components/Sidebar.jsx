// path: src/components/Sidebar.jsx
// ⭐ UPDATED: Tambah menu "Layanan Dokter" di bawah menu "Dokter"
// ✅ FIX: Pakai layanan-dokter.png sebagai ikon

import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import '../css/style.css'

import jecLogo from '../assets/logo/jec-logo.png';

import userIcon from '../assets/icons/user.png';
import pesananIcon from '../assets/icons/pesanan.png';
import rsIcon from '../assets/icons/rumah-sakit.png';
import obatIcon from '../assets/icons/obat.png';
import mapsIcon from '../assets/icons/maps.png';
import coinIcon from '../assets/icons/coins.png';
import cartIcon from '../assets/icons/cart.png';
import promoIcon from '../assets/icons/promo.png';
import testimoniIcon from '../assets/icons/testimonial.png';
import videoIcon from '../assets/icons/video.png';
import eventIcon from '../assets/icons/event.png';
import journalsIcon from '../assets/icons/journals.png';
import settingIcon from '../assets/icons/setting.png';
import fasilitasIcon from '../assets/icons/fasilitas.png';
import asuransiIcon from '../assets/icons/asuransi.png';
import doctorIcon from '../assets/icons/doctor.png';
import layananIcon from '../assets/icons/fasilitas.png';
import layananDokterIcon from '../assets/icons/layanan-dokter.png';

import lasikIcon from '../assets/icons/lasik.svg';
import flacsIcon from '../assets/icons/flacs.svg';

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Sidebar({ toggleSidebar }) {
  const [isLainnyaOpen, setIsLainnyaOpen] = useState(false);
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [isLayananOpen, setIsLayananOpen] = useState(false);

  const toggleLainnya = () => setIsLainnyaOpen(!isLainnyaOpen);
  const toggleSetting = () => setIsSettingOpen(!isSettingOpen);
  const toggleLayanan = () => setIsLayananOpen(!isLayananOpen);

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <img src={jecLogo} alt="JEC Logo" className="sidebar-logo" />
        <button onClick={toggleSidebar} className="sidebar-close-btn" aria-label="Tutup menu">
          <CloseIcon />
        </button>
      </div>
      <ul className="sidebar-menu">

        <li>
          <NavLink to="/" end>
            <span>Dashboard</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/users">
            <img src={userIcon} alt="Users" className="sidebar-icon" />
            <span>Users</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/pesanan">
            <img src={pesananIcon} alt="Pesanan" className="sidebar-icon" />
            <span>Pesanan</span>
          </NavLink>
        </li>

        {/* Dropdown Layanan (Lasik & Flacs) */}
        <li className="sidebar-menu-dropdown">
          <button
            onClick={toggleLayanan}
            className={`sidebar-menu-toggle ${isLayananOpen ? 'open' : ''}`}
            aria-expanded={isLayananOpen}
          >
            <img src={layananIcon} alt="Layanan" className="sidebar-icon" />
            <span>Layanan</span>
            <span className="toggle-icon"><ChevronDownIcon /></span>
          </button>
          <ul className={`sidebar-submenu ${isLayananOpen ? 'open' : ''}`}>
            <li>
              <NavLink to="/layanan/lasik">
                <img src={lasikIcon} alt="Lasik" className="sidebar-icon" />
                <span>Lasik</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/layanan/flacs">
                <img src={flacsIcon} alt="Flacs" className="sidebar-icon" />
                <span>Flacs</span>
              </NavLink>
            </li>
          </ul>
        </li>

        {/* Menu Dokter */}
        <li>
          <NavLink to="/dokter">
            <img src={doctorIcon} alt="Dokter" className="sidebar-icon" />
            <span>Dokter</span>
          </NavLink>
        </li>

        {/* ⭐ LAYANAN DOKTER — pakai layanan-dokter.png */}
        <li>
          <NavLink to="/layanan-dokter">
            <img src={layananDokterIcon} alt="Layanan Dokter" className="sidebar-icon" />
            <span>Layanan Dokter</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/rs">
            <img src={rsIcon} alt="Rumah Sakit" className="sidebar-icon" />
            <span>Rumah Sakit</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/fasilitas-rs">
            <img src={fasilitasIcon} alt="Fasilitas RS" className="sidebar-icon" />
            <span>Fasilitas Rumah Sakit</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/asuransi">
            <img src={asuransiIcon} alt="Asuransi" className="sidebar-icon" />
            <span>Asuransi</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/obat">
            <img src={obatIcon} alt="Obat" className="sidebar-icon" />
            <span>Obat</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/maps">
            <img src={mapsIcon} alt="Maps" className="sidebar-icon" />
            <span>Maps</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/coin">
            <img src={coinIcon} alt="Coin" className="sidebar-icon" />
            <span>Coin</span>
          </NavLink>
        </li>

        <li>
          <NavLink to="/cart">
            <img src={cartIcon} alt="Cart" className="sidebar-icon" />
            <span>Cart</span>
          </NavLink>
        </li>

        {/* Dropdown Lainnya */}
        <li className="sidebar-menu-dropdown">
          <button
            onClick={toggleLainnya}
            className={`sidebar-menu-toggle ${isLainnyaOpen ? 'open' : ''}`}
            aria-expanded={isLainnyaOpen}
          >
            <span>Lainnya</span>
            <span className="toggle-icon"><ChevronDownIcon /></span>
          </button>
          <ul className={`sidebar-submenu ${isLainnyaOpen ? 'open' : ''}`}>
            <li>
              <NavLink to="/promo">
                <img src={promoIcon} alt="Promo" className="sidebar-icon" />
                <span>Promo</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/testimoni">
                <img src={testimoniIcon} alt="Testimoni" className="sidebar-icon" />
                <span>Testimoni</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/videos">
                <img src={videoIcon} alt="Videos" className="sidebar-icon" />
                <span>Videos</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/event">
                <img src={eventIcon} alt="Event" className="sidebar-icon" />
                <span>Event</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/journals">
                <img src={journalsIcon} alt="Journals" className="sidebar-icon" />
                <span>Journals</span>
              </NavLink>
            </li>
          </ul>
        </li>

        {/* Dropdown Setting */}
        <li className="sidebar-menu-dropdown">
          <button
            onClick={toggleSetting}
            className={`sidebar-menu-toggle ${isSettingOpen ? 'open' : ''}`}
            aria-expanded={isSettingOpen}
          >
            <img src={settingIcon} alt="Setting" className="sidebar-icon" />
            <span>Setting</span>
            <span className="toggle-icon"><ChevronDownIcon /></span>
          </button>
          <ul className={`sidebar-submenu ${isSettingOpen ? 'open' : ''}`}>
            <li>
              <NavLink to="/setting/edit-admin">
                <span>Edit Admin</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/setting/hapus-akun">
                <span>Hapus Akun</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/logout">
                <span>Logout</span>
              </NavLink>
            </li>
          </ul>
        </li>

      </ul>
    </nav>
  )
}

export default Sidebar;