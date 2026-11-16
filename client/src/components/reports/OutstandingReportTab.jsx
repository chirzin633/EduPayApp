import { useEffect, useState } from "react";
import api from "../../utils/api";
import { downloadCsv } from "../../utils/downloadCsv";
import axios from "axios";
import ReportSummaryCard from "./ReportSummaryCard";
import ReportPagination from "./ReportPagination";
import { Link } from "react-router";

const STATUS_LABELS = {
  unpaid: { label: "Belum Dibayar", class: "bg-secondary" },
  partially_paid: { label: "Sebagian", class: "bg-warning text-dark" },
};

const EMPTY_FILTER = {
  academic_year_id: "",
  class_id: "",
  search: "",
};

export default function OutstandingReportTab() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState(EMPTY_FILTER);

  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMasterData() {
      try {
        setLoadingMaster(true);
        const [ayRes, clsRes] = await Promise.all([
          api.get("/academic-years", {
            signal: controller.signal,
            params: {
              per_page: 100,
            },
          }),
          api.get("/classes", {
            signal: controller.signal,
            params: {
              per_page: 100,
            },
          }),
        ]);

        setAcademicYears(ayRes.data.data);
        setClasses(clsRes.data.data);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        console.warn("Gagal memuat master data untuk filter laporan.", error);
      } finally {
        setLoadingMaster(false);
      }
    }

    fetchMasterData();
    return () => {
      controller.abort();
    };
  }, []);

  async function fetchReport(page = 1, f = appliedFilter) {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      Object.entries(f).forEach(([k, v]) => {
        if (v !== "") params.append(k, v);
      });
      const res = await api.get(
        `/reports/outstanding-balances?${params.toString()}`,
      );
      setData(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
      setSummary(res.data.summary ?? null);
    } catch {
      setErrorMessage("Gagal memuat laporan tunggakan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  }

  function applyFilter(e) {
    e.preventDefault();
    setAppliedFilter(filter);
    fetchReport(1, filter);
  }

  function resetFilter() {
    setFilter(EMPTY_FILTER);
    setAppliedFilter(EMPTY_FILTER);
    fetchReport(1, EMPTY_FILTER);
  }

  async function handleExport() {
    setIsExporting(true);
    setErrorMessage("");

    try {
      await downloadCsv(
        "outstanding",
        appliedFilter,
        `laporan-tunggakan-${Date.now()}.csv`,
      );
    } catch (error) {
      let message = "Gagal mengekspor CSV.";
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {
          /* ignore */
        }
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      setErrorMessage(message);
    } finally {
      setIsExporting(false);
    }
  }

  function formatRupiah(value) {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div>
      {/* filter */}
      <form onSubmit={appliedFilter} className="row g-2 mb-3">
        <div className="col-md-4 col-12">
          <select
            name="academic_year_id"
            className="form-select"
            value={filter.academic_year_id}
            onChange={handleFilterChange}
            disabled={loadingMaster}
          >
            <option value="">Semua Tahun Ajaran</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-4 col-12">
          <select
            name="class_id"
            className="form-select"
            value={filter.class_id}
            onChange={handleFilterChange}
            disabled={loadingMaster}
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 d-flex justify-content-end">
          <button type="submit" className="btn btn-outline-primary me-2">
            <i className="bi bi-search me-1"></i> Terapkan Filter
          </button>
          <button
            type="button"
            className="btn btn-light-secondary me-2"
            onClick={resetFilter}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Mengekspor...
              </>
            ) : (
              <>
                <i className="bi bi-download me-1"></i> Ekspor CSV
              </>
            )}
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
        </div>
      )}

      {/* summary */}
      {summary && (
        <ReportSummaryCard
          title="Ringkasan Tunggakan"
          items={[
            {
              label: "Jumlah Siswa",
              value: summary.total_students,
            },
            {
              label: "Total Tunggakan",
              value: formatRupiah(summary.total_outstanding),
              className: "text-danger",
            },
          ]}
        />
      )}

      {/* table */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>No. Invoice</th>
                <th>Siswa</th>
                <th>Tahun Ajaran</th>
                <th>Status</th>
                <th className="text-end">Total</th>
                <th className="text-end">Terbayar</th>
                <th className="text-end">Sisa</th>
                <th style={{ width: "80px" }}></th>
              </tr>
            </thead>
            <tbody>
              {data.length ? (
                data.map((inv) => {
                  const s = STATUS_LABELS[inv.status] ?? {
                    label: inv.status,
                    class: "bg-secondary",
                  };
                  return (
                    <tr key={inv.id}>
                      <td className="fw-bold">{inv.invoice_number}</td>
                      <td>
                        <div className="fw-bold">
                          {inv.student?.full_name ?? "-"}
                        </div>
                        <small className="text-muted">
                          {inv.student?.nis ?? ""}
                        </small>
                      </td>
                      <td>{inv.academic_year?.name ?? "-"}</td>
                      <td>
                        <span className={`badge ${s.class}`}>{s.label}</span>
                      </td>
                      <td className="text-end">
                        {formatRupiah(inv.total_amount)}
                      </td>
                      <td className="text-end text-success">
                        {formatRupiah(inv.paid_amount)}
                      </td>
                      <td className="text-end text-danger fw-bold">
                        {formatRupiah(inv.outstanding_amount)}
                      </td>
                      <td>
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-3">
                    Tidak ada tunggakan untuk filter ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ReportPagination
        meta={meta}
        onPageChange={(page) => fetchReport(page, appliedFilter)}
      />

      <div className="alert alert-info mt-3 py-2 mb-0">
        <small>
          <i className="bi bi-info-circle me-1"></i>
          Laporan ini hanya menampilkan invoice dengan sisa tunggakan &gt; 0 dan
          bukan <code>cancelled</code>. Data kelas tidak tersedia di response;
          gunakan filter kelas untuk mempersempit hasil.
        </small>
      </div>
    </div>
  );
}
