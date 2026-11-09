import { useState } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ isSidebarActive, toggleSidebar }) {
  const { user, logout } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  function toggleSubmenu(menu) {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  }

  return (
    <div id="sidebar" className={isSidebarActive ? "active" : ""}>
      <div className="sidebar-wrapper active d-flex flex-column justify-content-between">
        {/* Logo Section */}
        <div className="sidebar-header position-relative">
          <div className="d-flex justify-content-between align-items-center">
            <div className="logo">
              <NavLink to={"/"}>
                <h4 className="text-primary fw-bold m-0">EduPay</h4>
              </NavLink>
            </div>

            <div className="sidebar-toggler x">
              <button
                className="sidebar-hide d-xl-none d-block btn btn-link p-0 text-muted"
                onClick={toggleSidebar}
              >
                <i className="bi bi-x bi-middle fs-3"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="sidebar-menu">
          <ul className="menu">
            <li className="sidebar-title">Menu Utama</li>

            <li className="sidebar-item">
              <NavLink to={"/"} className="sidebar-link">
                <i className="bi bi-speedometer"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>

            <li className="sidebar-title">Siklus Pembayaran</li>

            <li
              className={`sidebar-item has-sub ${openSubmenu === "pmb" ? "active" : ""}`}
            >
              <a
                href="#"
                className="sidebar-link"
                onClick={() => toggleSubmenu("pmb")}
              >
                <i className="bi bi-person-add"></i>
                <span>PMB & Pendaftaran</span>
              </a>
              <ul
                className={`submenu ${openSubmenu === "pmb" ? "active" : ""}`}
              >
                <li className="submenu-item">
                  <a href="#">Data Calon Siswa</a>
                </li>
                <li className="submenu-item">
                  <a href="#">Formulir & Bayar</a>
                </li>
              </ul>
            </li>

            <li className="sidebar-item">
              <a href="#" className="sidebar-link">
                <i className="bi bi-credit-card-fill"></i>
                <span>Kasir & Pembayaran</span>
              </a>
            </li>

            <li className="sidebar-item">
              <a href="#" className="sidebar-link">
                <i className="bi bi-archive-fill"></i>
                <span>Laporan</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
