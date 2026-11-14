import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import { downloadReceipt } from "../utils/downloadReceipt";
import PaymentVoidModal from "../components/PaymentVoidModal";

const STATUS_LABELS = {
  completed: { label: "Lunas", class: "bg-success" },
  voided: { label: "Void", class: "bg-danger" },
};

const METHOD_LABELS = {
  cash: "Tunai",
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  debit_edc: "EDC Debit",
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });

  const [filter, setFilter] = useState({
    invoice_id: "",
    status: "",
    payment_method: "",
  });

  // modal void
  const [voidTarget, setVoidTarget] = useState(null);
  const [isVoiding, setIsVoiding] = useState(false);
  const [voidError, setVoidError] = useState("");

  // download state per payment id
  const [downloadingId, setDownloadingId] = useState(null);

  async function fetchPayments(page = 1, appliedFilter = filter) {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      if (appliedFilter.invoice_id) {
        params.append("invoice_id", appliedFilter.invoice_id);
      }
      if (appliedFilter.status) {
        params.append("status", appliedFilter.status);
      }

      const res = await api.get(`/payments?${params.toString()}`);
      setPayments(res.data.data);
      setPagination({
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
      });
    } catch {
      setErrorMessage("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
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
    fetchPayments(1, filter);
  }

  function resetFilter() {
    const empty = { invoice_id: "", status: "", payment_method: "" };
    setFilter(empty);
    fetchPayments(1, empty);
  }

  const visiblePayments = filter.payment_method
    ? payments.filter(
        (payment) => payment.payment_method === filter.payment_method,
      )
    : payments;

  async function handleVoidSubmit(reason) {
    if (!voidTarget) return;
    setIsVoiding(true);
    setVoidError("");
    try {
      await api.post(`/payments/${voidTarget.id}/void`, {
        void_reason: reason,
      });
      setVoidTarget(null);
      setSuccessMessage("Pembayaran berhasil dibatalkan (void).");
      await fetchPayments(pagination.current_page, filter);
    } catch (error) {
      if (error.response?.status === 422) {
        setVoidError(
          error.response.data.message || "Pembayaran tidak dapat di-void.",
        );
      } else {
        setVoidError(
          error.response?.data?.message || "Terjadi kesalahan pada server.",
        );
      }
    } finally {
      setIsVoiding(false);
    }
  }

  async function handleDownloadReceipt(payment) {
    setDownloadingId(payment.id);
    try {
      await downloadReceipt(
        payment.id,
        `kuitansi-${payment.receipt_number}.pdf`,
      );
    } catch (error) {
      let message = "Gagal mengunduh kuitansi.";
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {}
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      setErrorMessage(error);
    } finally {
      setDownloadingId(null);
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
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <h3 className="">Kasir / Pembayaran</h3>
            <p className="text-subtitle text-muted mb-0">
              Catat pembayaran siswa, void transaksi, dan unduh kuitansi.
            </p>
          </div>
          {isAdmin && (
            <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
              <Link to="/payments/create" className="btn btn-primary">
                <i className="bi bi-plus-lg me-1"></i> Catat Pembayaran
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
            <h4 className="card-title">Daftar Pembayaran</h4>
          </div>
          <div className="card-body">
            {/* filter */}
            <form onSubmit={applyFilter} className="row g-2 mb-3">
              <div className="col-md-3 col-12">
                <input
                  type="number"
                  name="invoice_id"
                  className="form-control"
                  placeholder="ID Invoice"
                  value={filter.invoice_id}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="col-md-3 col-12">
                <select
                  name="status"
                  className="form-select"
                  value={filter.status}
                  onChange={handleFilterChange}
                >
                  <option value="">Semua Status</option>
                  <option value="completed">Lunas</option>
                  <option value="voided">Void</option>
                </select>
              </div>

              <div className="col-md-3 col-12">
                <select
                  name="payment_method"
                  className="form-select"
                  value={filter.payment_method}
                  onChange={handleFilterChange}
                >
                  <option value="">Semua Metode Pembayaran</option>
                  <option value="cash">Tunai</option>
                  <option value="bank_transfer">Transfer Bank</option>
                  <option value="qris">QRIS</option>
                  <option value="debit_edc">EDC Debit</option>
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

            <div className="alert alert-info py-2 mb-3">
              <small>
                <i className="bi bi-info-circle me-1"></i>
                Filter metode pembayaran diterapkan di sisi klien karena
                endpoint server belum mendukung parameter ini.
              </small>
            </div>

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
                      <th>Invoice</th>
                      <th>Metode</th>
                      <th className="text-end">Nominal</th>
                      <th>Status</th>
                      <th>Petugas</th>
                      <th style={{ width: "140px" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePayments.length ? (
                      visiblePayments.map((p) => {
                        const s = STATUS_LABELS[p.status] ?? {
                          label: p.status,
                          class: "bg-secondary",
                        };
                        return (
                          <tr key={p.id}>
                            <td className="fw-bold">{p.receipt_number}</td>
                            <td>
                              {new Date(p.payment_date).toLocaleDateString(
                                "id-ID",
                              )}
                            </td>
                            <td>#{p.invoice_id}</td>
                            <td>
                              {METHOD_LABELS[p.payment_method] ??
                                p.payment_method}
                            </td>
                            <td className="text-end">
                              {formatRupiah(p.amount)}
                            </td>
                            <td>
                              <span className={`badge ${s.class}`}>
                                {s.label}
                              </span>
                            </td>
                            <td>{p.recorded_by?.name ?? "-"}</td>
                            <td>
                              {p.status === "completed" && (
                                <>
                                  <button
                                    className="btn btn-sm btn-outline-primary me-1"
                                    onClick={() => handleDownloadReceipt(p)}
                                    disabled={downloadingId === p.id}
                                    title="Unduh kuitansi PDF"
                                  >
                                    {downloadingId === p.id ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      <i className="bi bi-receipt"></i>
                                    )}
                                  </button>
                                  {isAdmin && (
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => {
                                        setVoidTarget(p);
                                        setVoidError("");
                                      }}
                                      title="Void pembayaran"
                                    >
                                      <i className="bi bi-x-circle"></i>
                                    </button>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-3">
                          Belum ada data pembayaran
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
                    fetchPayments(pagination.current_page - 1, filter)
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
                    fetchPayments(pagination.current_page + 1, filter)
                  }
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* modal void */}
      <PaymentVoidModal
        payment={voidTarget}
        isSubmitting={isVoiding}
        errorMessage={voidError}
        onClose={() => {
          setVoidTarget(null);
          setVoidError("");
        }}
        onSubmit={handleVoidSubmit}
      />
    </div>
  );
}
