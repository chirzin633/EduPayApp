import { NavLink, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import Logo from "./svg/Logo";
import Light from "./svg/Light";
import Dark from "./svg/Dark";

export default function Sidebar({ isSidebarActive, toggleSidebar }) {
  const { user } = useAuth();
  const sidebarWrapperRef = useRef(null);

  const [isDark, setIsDark] = useState(getInitialThemne);

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-bs-theme", theme);
    document.body.classList.toggle("theme-dark", isDark);
    document.body.classList.toggle("theme-light", !isDark);
    localStorage.setItem("theme", theme);
  }, [isDark]);

  useEffect(() => {
    const el = sidebarWrapperRef.current;
    if (!el || !window.PerfectScrollbar) {
      return;
    }

    const ps = new window.PerfectScrollbar(el, {
      wheelPropagation: false,
      wheelSpeed: 0.7,
      suppressScrollX: true,
    });

    return () => {
      ps.destroy();
    };
  }, []);

  function getInitialThemne() {
    const saved = localStorage.getItem("theme");
    if (saved) {
      return saved === "dark";
    }

    return document.documentElement.getAttribute("data-bs-theme") === "dark";
  }

  return (
    <div id="sidebar" className={isSidebarActive ? "active" : ""}>
      <div
        ref={sidebarWrapperRef}
        className="sidebar-wrapper active d-flex flex-column justify-content-between"
      >
        {/* Logo Section */}
        <div className="sidebar-header position-relative">
          <div className="d-flex justify-content-between align-items-center">
            <div className="logo">
              <NavLink to={"/"} className="d-flex align-items-center gap-2">
                <Logo />
                <h4 className="text-primary fw-bold m-0">EduPay</h4>
              </NavLink>
            </div>

            {/* Theme Toggle Mazer */}
            <div className="theme-toggle d-flex gap-2 align-items-center mt-2">
              <Light />

              <div className="form-check form-switch fs-6">
                <input
                  className="form-check-input me-0"
                  type="checkbox"
                  id="toggle-dark"
                  style={{ cursor: "pointer" }}
                  checked={isDark}
                  onChange={(e) => setIsDark(e.target.checked)}
                />
                <label
                  className="form-check-label"
                  htmlFor="toggle-dark"
                ></label>
              </div>

              <Dark />
            </div>

            <div className="sidebar-toggler x">
              <button
                className="sidebar-hide d-xl-none d-block btn btn-link"
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

            <SidebarItem
              to={"/dashboard"}
              icon={"bi-speedometer"}
              label={"Dashboard"}
            />

            {/* Menu Khusus Admin */}
            {user?.role === "admin" && (
              <>
                <li className="sidebar-title">Master Data</li>
                <SidebarItem
                  to={"/academic-years"}
                  icon={"bi-calendar-event"}
                  label={"Tahun Ajaran"}
                />

                <SidebarItem
                  to={"/classes"}
                  icon={"bi-door-open"}
                  label={"Data Kelas"}
                />

                <SidebarItem
                  to={"/students"}
                  icon={"bi-people"}
                  label={"Data Siswa"}
                />

                <SidebarItem
                  to={"/student-class-assignments"}
                  icon={"bi-diagram-3"}
                  label={"Penempatan Kelas"}
                />

                <SidebarItem
                  to={"/fee-components"}
                  icon={"bi-receipt-cutoff"}
                  label={"Komponen Biaya"}
                />
              </>
            )}

            {/* Menu Operasional Pembayaran */}
            <li className="sidebar-title">Transaksi & Laporan</li>

            <SidebarItem
              to={"/invoices"}
              icon={"bi-file-earmark-text"}
              label={"Tagihan (Invoice)"}
            />

            <SidebarItem
              to={"/payments"}
              icon={"bi-credit-card"}
              label={"Kasir / Pembayaran"}
            />

            <SidebarItem
              to={"/reports"}
              icon={"bi-bar-chart-line"}
              label={"Laporan Keuangan"}
            />
          </ul>
        </div>
      </div>
    </div>
  );
}

function SidebarItem(props) {
  const { to, icon, label } = props;
  const { pathname } = useLocation();
  const isActive = pathname === to || pathname.startsWith(`${to}/`);

  return (
    <li className={`sidebar-item ${isActive ? "active" : ""}`}>
      <NavLink to={to} className="sidebar-link">
        <i className={`bi ${icon}`}></i>
        <span>{label}</span>
      </NavLink>
    </li>
  );
}
