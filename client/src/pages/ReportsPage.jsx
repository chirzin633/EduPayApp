import { useState } from "react";
import PaymentReportTab from "../components/reports/PaymentReportTab";
import OutstandingReportTab from "../components/reports/OutstandingReportTab";
import StudentHistoryTab from "../components/reports/StudentHistoryTab";

const TABS = [
  { key: "payments", label: "Pembayaran", icon: "bi-cash-coin" },
  { key: "outstanding", label: "Tunggakan", icon: "bi-exclamation-circle" },
  { key: "student", label: "Riwayat Siswa", icon: "bi-person-lines-fill" },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("payments");

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <h3>Laporan Keuangan</h3>
        <p className="text-subtitle text-muted mb-0">
          Laporan pembayaran, tunggakan, dan riwayat siswa. Ekspor ke CSV
          tersedia per laporan.
        </p>
      </div>

      <section className="section">
        <div className="card">
          <div className="card-header p-0">
            <ul className="nav nav-tabs card-header-tabs mx-0">
              {TABS.map((tab) => (
                <li className="nav-item" key={tab.key}>
                  <button
                    className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                  >
                    <i className={`bi ${tab.icon} me-1`}></i>
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-body">
            {activeTab === "payments" && <PaymentReportTab />}
            {activeTab === "outstanding" && <OutstandingReportTab />}
            {activeTab === "student" && <StudentHistoryTab />}
          </div>
        </div>
      </section>
    </div>
  );
}
