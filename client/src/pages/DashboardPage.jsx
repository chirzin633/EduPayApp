import { useEffect, useState } from "react";
import api from "../utils/api";
import axios from "axios";
import SummaryCards from "../components/dashboard/SummaryCards";
import MonthlyRevenueChart from "../components/dashboard/MonthlyRevenueChart";
import StatusDistributionChart from "../components/dashboard/StatusDistributionChart";
import RevenueByMethodChart from "../components/dashboard/RevenueByMethodChart";
import TopOutstandingChart from "../components/dashboard/TopOutstandingChart";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load daftar tahun ajaran untuk filter
  useEffect(() => {
    const controller = new AbortController();

    async function fetchAcademicYears() {
      try {
        const res = await api.get("academic-years", {
          signal: controller.signal,
          params: {
            per_page: 100,
          },
        });

        const academicYears = res.data.data ?? [];

        setAcademicYears(academicYears);

        const active = academicYears.find(
          (academicYear) => academicYear.is_active,
        );

        if (active) {
          setSelectedYear(String(active.id));
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        console.warn(
          "Gagal memuat tahun ajaran untuk filter dashboard.",
          error,
        );
      }
    }
    fetchAcademicYears();
    return () => {
      controller.abort();
    };
  }, []);

  async function fetchDashboard(yearId = selectedYear) {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();

      if (yearId) {
        params.append("academic_year_id", yearId);
      }

      const res = await api.get(`/dashboard?${params.toString()}`);
      setData(res.data.data);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Gagal memuat data dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Fetch pertama setelah tahun ajaran ter-load (agar default aktif terpakai)
  useEffect(() => {
    if (academicYears.length === 0 && selectedYear === "") {
      fetchDashboard("");
      return;
    }

    if (selectedYear !== "") {
      fetchDashboard(selectedYear);
    } else {
      fetchDashboard("");
    }
  }, [academicYears, selectedYear]);

  function handleYearChange(e) {
    setSelectedYear(e.target.value);
  }

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-8">
            <h3>Dashboard</h3>
            <p className="text-subtitle text-muted mb-0">
              Ringkasan keuangan dan aktivitas pembayaran sekolah.
            </p>
          </div>
          <div className="col-12 col-md-4 mt-md-0">
            <label className="form-label small mb-0">Tahun Ajaran</label>
            <select
              className="form-select"
              value={selectedYear}
              onChange={handleYearChange}
            >
              <option value="">Semua Tahun Ajaran</option>
              {academicYears.map((academicYear) => (
                <option value={academicYear.id} key={academicYear.id}>
                  {academicYear.name}
                  {academicYear.is_active ? " (aktif)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
        </div>
      )}

      {loading && !data && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      {data && (
        <>
          <SummaryCards summary={data.summary} />

          <div className="row g-3 mb-3">
            <MonthlyRevenueChart data={data.monthly_revenue ?? []} />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-lg-6 col-12">
              <StatusDistributionChart
                data={data.payment_status_distribution ?? []}
              />
            </div>
            <div className="col-lg-6 col-12">
              <RevenueByMethodChart
                data={data.revenue_by_payment_method ?? []}
              />
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12">
              <TopOutstandingChart data={data.top_outstanding_by_class ?? []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
