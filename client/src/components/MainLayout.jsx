import { useState } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export default function MainLayout({ children }) {
  const { user, logout } = useAuth();
  const [isSidebarActive, setIsSidebarActive] = useState(true);

  function toggleSidebar() {
    setIsSidebarActive(!isSidebarActive);
  }
  return (
    <>
      <Sidebar
        isSidebarActive={isSidebarActive}
        toggleSidebar={toggleSidebar}
      />
      <div id="main">
        <header className="mb-3">
          <button
            className="burger-btn d-block d-xl-none btn btn-link p-0 text-dark"
            onClick={toggleSidebar}
          >
            <i className="bi bi-justify fs-3"></i>
          </button>

          <div className="dropdown float-end">
            <a
              href="#"
              id="topbarUserDropdown"
              className="user-dropdown d-flex align-items-center dropend dropdown-toggle "
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="avatar avatar-md2">
                <img src="https://i.pravatar.cc/400" alt="Avatar" />
              </div>
              <div className="text">
                <h6 className="user-dropdown-name">{user?.name}</h6>
                <p className="user-dropdown-status text-sm text-muted">
                  {user?.role}
                </p>
              </div>
            </a>
            <ul
              className="dropdown-menu dropdown-menu-end shadow-lg"
              aria-labelledby="topbarUserDropdown"
            >
              <li>
                <a className="dropdown-item" href="#">
                  My Account
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  Settings
                </a>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button onClick={logout} className="dropdown-item">
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </header>

        <div className="page-content">{children}</div>

        <footer>
          <div className="footer clearfix mb-0 text-muted">
            <div className="float-start">
              <p>2026 &copy; Sekolah Swasta</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
