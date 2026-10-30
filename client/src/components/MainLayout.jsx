import { useState } from "react";
import Sidebar from "./Sidebar";

export default function MainLayout({ children }) {
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
        </header>

        <div className="page-heading">
          <h3>Sistem Manajemen Pembayaran Sekolah</h3>
        </div>

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
