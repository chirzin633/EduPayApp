import { Link } from "react-router";
import api from "../../utils/api";
import { downloadCsv } from "../../utils/downloadCsv";
import { useEffect, useState } from "react";
import axios from "axios";
import ReportPagination from "./ReportPagination";
import ReportSummaryCard from "./ReportSummaryCard";

const METHOD_LABELS = {
  cash: "Tunai",
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  debit_edc: "EDC Debit",
};

const EMPTY_FILTER = {
  academic_year_id: "",
  class_id: "",
  payment_method: "",
  date_from: "",
  date_to: "",
  search: "",
};

export default function PaymentReportTab() {
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
      Object.entries(f).forEach(([key, value]) => {
        if (value !== "") {
          params.append(key, value);
        }
      });

      const res = await api.get(`/reports/payments?${params.toString()}`);
      setData(res.data.data ?? []);
      setMeta(res.data.meta ?? null);
      setSummary(res.data.summary ?? null);
    } catch {
      setErrorMessage("Gagal memuat laporan pembayaran.");
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
        "payments",
        appliedFilter,
        `laporan-pembayaran-${Date.now()}.csv`,
      );
    } catch (error) {
      let message = "Gagal mengekspor CSV.";

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {}
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
      <form onSubmit={applyFilter} className="row g-2 mb-3 align-items-end">
        <div className="col-md-4 col-12">
          <select
            name="academic_year_id"
            id="academic_year_id"
            className="form-select"
            value={filter.academic_year_id}
            onChange={handleFilterChange}
            disabled={loadingMaster}
          >
            <option value="">Semua Tahun Ajaran</option>
            {academicYears.map((academicYear) => (
              <option value={academicYear.id} key={academicYear.id}>
                {academicYear.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3 col-12">
          <select
            name="payment_method"
            id="payment_method"
            className="form-select"
            value={filter.payment_method}
            onChange={handleFilterChange}
          >
            <option value="">Semua Metode</option>
            <option value="cash">Tunai</option>
            <option value="bank_transfer">Transfer Bank</option>
            <option value="qris">QRIS</option>
            <option value="debit_edc">EDC Debit</option>
          </select>
        </div>

        <div className="col-md-3 col-12">
          <input
            type="text"
            name="search"
            className="form-control"
            placeholder="Cari No. Kwitansi /  Nama / NIS..."
            value={filter.search}
            onChange={handleFilterChange}
          />
        </div>

        <div className="col-md-3 col-12">
          <label className="form-label small mb-0">Dari Tanggal</label>
          <input
            type="date"
            name="date_from"
            className="form-control"
            value={filter.date_from}
            onChange={handleFilterChange}
          />
        </div>

        <div className="col-md-3 col-12">
          <label className="form-label small mb-0">Sampai Tanggal</label>
          <input
            type="date"
            name="date_to"
            className="form-control"
            value={filter.date_to}
            onChange={handleFilterChange}
          />
        </div>

        <div className="col-md-6 col-12 d-flex align-items-end">
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

      {/* Summary */}
      {summary && (
        <ReportSummaryCard
          title="Ringkasan Pembayaran"
          items={[
            {
              label: "Total Transaksi",
              value: summary.total_transactions,
            },
            {
              label: "Total Nominal",
              value: formatRupiah(summary.total_amount),
              className: "text-success",
            },
          ]}
        />
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>No. Kuitansi</th>
                <th>Tanggal</th>
                <th>Metode</th>
                <th className="text-end">Nominal</th>
                <th>Petugas</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {data.length ? (
                data.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-bold">{p.receipt_number}</td>
                    <td>
                      {new Date(p.payment_date).toLocaleDateString("id-ID")}
                    </td>
                    <td>
                      {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                    </td>
                    <td className="text-end">{formatRupiah(p.amount)}</td>
                    <td>{p.recorded_by?.name ?? "-"}</td>
                    <td>
                      <Link
                        to={`/invoices/${p.invoice_id}`}
                        className="btn btn-sm btn-outline-primary"
                      >
                        #{p.invoice_id}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    Tidak ada data pembayaran untuk filter ini
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
          Data siswa (NIS/nama) tidak disertakan pada Payment Resource. Gunakan
          kolom pencarian untuk memfilter berdasarkan siswa di server, atau klik
          nomor invoice untuk melihat detail.
        </small>
      </div>
    </div>
  );
}
