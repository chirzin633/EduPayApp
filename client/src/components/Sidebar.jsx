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
                <i class="bi bi-speedometer"></i>
                <span>Dashboard</span>
              </NavLink>
            </li>

            {/* Menu Khusus Admin */}
            {user?.role === "admin" && (
              <>
                <li className="sidebar-title">Master Data</li>
                <li className="sidebar-item">
                  <NavLink to="/academic-years" className="sidebar-link">
                    <i className="bi bi-calendar-event"></i>
                    <span>Tahun Ajaran</span>
                  </NavLink>
                </li>
                <li className="sidebar-item">
                  <NavLink to="/classes" className="sidebar-link">
                    <i className="bi bi-door-open"></i>
                    <span>Data Kelas</span>
                  </NavLink>
                </li>
                <li className="sidebar-item">
                  <NavLink to="/students" className="sidebar-link">
                    <i className="bi bi-people"></i>
                    <span>Data Siswa</span>
                  </NavLink>
                </li>
                <li className="sidebar-item">
                  <NavLink to="/fee-components" className="sidebar-link">
                    <i className="bi bi-receipt-cutoff"></i>
                    <span>Komponen Biaya</span>
                  </NavLink>
                </li>
              </>
            )}

            {/* Menu Operasional Pembayaran */}
            <li className="sidebar-title">Transaksi & Laporan</li>
            <li className="sidebar-item">
              <NavLink to="/invoices" className="sidebar-link">
                <i className="bi bi-file-earmark-text"></i>
                <span>Tagihan (Invoice)</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/payments" className="sidebar-link">
                <i className="bi bi-credit-card"></i>
                <span>Kasir / Pembayaran</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/reports" className="sidebar-link">
                <i className="bi bi-bar-chart-line"></i>
                <span>Laporan Keuangan</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
