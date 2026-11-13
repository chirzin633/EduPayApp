import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const STATUS_LABEL = {
  unpaid: { label: "Belum Dibayar", class: "bg-secondary" },
  partially_paid: { label: "Sebagian", class: "bg-warning text-dark" },
  paid: { label: "Lunas", class: "bg-success" },
  cancelled: { label: "Dibatalkan", class: "bg-danger" },
};

export default function InvoicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });

  const [filter, setFilter] = useState({
    status: "",
    student_id: "",
    academic_year_id: "",
  });

  // master data untuk filter
  const [students, setStudents] = useState([]);
  const [academicYear, setAcadmicYears] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  async function fetchMasterData() {
    setLoading(true);
    try {
      const [stuRes, ayRes] = await Promise.all([
        api.get("/students?per_page=100"),
        api.get("/academic-years?per_page=100"),
      ]);
      setStudents(stuRes.data.data);
      setAcadmicYears(ayRes.data.data);
    } catch {
      console.warn("Gagal memuat master data filter.");
    } finally {
      setLoadingMaster(false);
    }
  }

  async function fetchInvoices(page = 1, appliedFilter = filter) {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.append("page", page);

      if (appliedFilter.status) {
        params.append("status", appliedFilter.status);
      }
      if (appliedFilter.student_id) {
        params.append("student_id", appliedFilter.student_id);
      }
      if (appliedFilter.academic_year_id) {
        params.append("academic_year_id", appliedFilter.academic_year_id);
      }

      const res = await api.get(`/invoices?${params.toString()}`);
      setInvoices(res.data.data);
      setPagination({
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
      });
    } catch {
      setErrorMessage("Gagal memuat data invoice.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMasterData();
    fetchInvoices();
    if (location.state?.flash) {
      setSuccessMessage(location.state.flash);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  }

  function applyFilter(e) {
    e.preventDefault();
    fetchInvoices(1, filter);
  }

  function resetFilter() {
    const empty = { status: "", student_id: "", academic_year_id: "" };
    setFilter(empty);
    fetchInvoices(1, empty);
  }

  function formatRupiah(value) {
    if (value === null || value === undefined) {
      return "-";
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  }

  return (
    <div className="page-heading">
      <div className="page-header mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <h3>Daftar Tagihan (Invoice)</h3>
            <p className="text-subtitle text-muted mb-0">
              Kelola tagihan siswa, status pembayaran, dan sisa tunggakan.
            </p>
          </div>
          {isAdmin && (
            <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
              <Link to="/invoices/create" className="btn btn-primary">
                <i className="bi bi-plus-lg me-1"></i> Buat Invoice
              </Link>
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
        </div>
      )}

      <section className="section">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Daftar Invoice</h4>
          </div>
          <div className="card-body">
            {/* filter */}
            <form onSubmit={applyFilter} className="row g-2 mb-3">
              <div className="col-md-3 col-12">
                <select
                  name="status"
                  id="status"
                  className="form-select"
                  value={filter.status}
                  onChange={handleFilterChange}
                >
                  <option value="">Semua Status</option>
                  <option value="unpaid">Belum Dibayar</option>
                  <option value="partially_paid">Sebagian</option>
                  <option value="paid">Lunas</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>

              <div className="col-md-3 col-12">
                <select
                  name="student_id"
                  id="student_id"
                  className="form-select"
                  value={filter.student_id}
                  onChange={handleFilterChange}
                  disabled={loadingMaster}
                >
                  <option value="">Semua Siswa</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nis} - {student.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 col-12">
                <select
                  name="academic_year_id"
                  id="academic_year_id"
                  className="form-select"
                  value={filter.academic_year_id}
                  onChange={handleFilterChange}
                  disabled={loadingMaster}
                >
                  <option value="">Semua Tahun Ajaran</option>
                  {academicYear.map((academicYear) => (
                    <option key={academicYear.id} value={academicYear.id}>
                      {academicYear.name} -{" "}
                      {academicYear.is_active ? " (aktif)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 col-12">
                <button type="submit" className="btn btn-outline-primary me-2">
                  <i className="bi bi-search me-1"></i> Filter
                </button>
                <button
                  type="button"
                  className="btn btn-light-secondary"
                  onClick={resetFilter}
                >
                  Reset
                </button>
              </div>
            </form>

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
                      <th>Tanggal</th>
                      <th>Siswa</th>
                      <th>Tahun Ajaran</th>
                      <th className="text-end">Total</th>
                      <th className="text-end">Terbayar</th>
                      <th className="text-end">Sisa</th>
                      <th>Status</th>
                      <th style={{ width: "90px" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length ? (
                      invoices.map((invoice) => {
                        const s = STATUS_LABEL[invoice.status] ?? {
                          label: invoice.status,
                          class: "bg-secondary",
                        };
                        return (
                          <tr key={invoice.id}>
                            <td className="fw-bold">
                              {invoice.invoice_number}
                            </td>
                            <td>{invoice.invoice_date}</td>
                            <td>
                              <div className="fw-bold">
                                {invoice.student?.full_name ?? "-"}
                              </div>
                              <small className="text-muted">
                                {invoice.student?.nis ?? ""}
                              </small>
                            </td>
                            <td>{invoice.academic_year?.name ?? "-"}</td>
                            <td className="text-end">
                              {formatRupiah(invoice.total_amount)}
                            </td>
                            <td className="text-end text-success">
                              {formatRupiah(invoice.paid_amount)}
                            </td>
                            <td className="text-end text-danger">
                              {formatRupiah(invoice.outstanding_amount)}
                            </td>
                            <td>
                              <span className={`badge ${s.class}`}>
                                {s.label}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                title="Lihat detail"
                                onClick={() =>
                                  navigate(`/invoices/${invoice.id}`)
                                }
                              >
                                <i className="bi bi-eye"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="text-center text-muted py-3">
                          Belum ada data invoice
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {pagination.last_page > 1 && (
              <div className="d-flex justify-content-end mt-3">
                <button
                  className="btn btn-sm btn-outline-secondary me-2"
                  disabled={pagination.current_page === 1}
                  onClick={() =>
                    fetchInvoices(pagination.current_page - 1, filter)
                  }
                >
                  Previous
                </button>
                <span className="align-self-center mx-2 text-muted">
                  Halaman {pagination.current_page} dari {pagination.last_page}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() =>
                    fetchInvoices(pagination.current_page + 1, filter)
                  }
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
