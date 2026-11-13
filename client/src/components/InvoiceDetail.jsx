import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import api from "../utils/api";

const STATUS_LABELS = {
  unpaid: { label: "Belum Dibayar", class: "bg-secondary" },
  partially_paid: { label: "Sebagian", class: "bg-warning text-dark" },
  paid: { label: "Lunas", class: "bg-success" },
  cancelled: { label: "Dibatalkan", class: "bg-danger" },
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  async function fetchInvoice() {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setErrorMessage("Invoice tidak ditemukan.");
      } else {
        setErrorMessage("Gagal memuat detail invoice.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoice();
    if (location.state?.flash) {
      setSuccessMessage(location.state.flash);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [id]);

  async function handleCancel() {
    if (
      !window.confirm(
        "Yakin ingin membatalkan invoice ini? Tindakan ini tidak dapat diurungkan.",
      )
    ) {
      return;
    }
    setIsCancelling(true);
    setErrorMessage("");
    try {
      await api.post(`/invoices/${id}/cancel`);
      setSuccessMessage("Invoice berhasil dibatalkan");
      await fetchInvoice();
    } catch (error) {
      if (error.response?.status === 422) {
        setErrorMessage(
          error.response.data.message || "Invoice tidak dapat dibatalkan.",
        );
      } else {
        setErrorMessage(
          error.response?.data?.message || "Terjadi kesalahan pada server.",
        );
      }
    } finally {
      setIsCancelling(false);
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="page-heading">
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage || "Invoice tidak ditemukan."}
        </div>
        <Link to="/invoices" className="btn btn-light-secondary">
          <i className="bi bi-arrow-left me-1"></i> Kembali
        </Link>
      </div>
    );
  }

  const s = STATUS_LABELS[invoice.status] ?? {
    label: invoice.status,
    class: "bg-secondary",
  };

  const hasCompletedPayment = (invoice.payments ?? []).some(
    (p) => p.status === "completed",
  );

  const canCancel =
    isAdmin && invoice.status !== "cancelled" && !hasCompletedPayment;

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-8">
            <h3>Invoice {invoice.invoice_number}</h3>
            <p className="text-subtitle text-muted mb-0">
              {invoice.status?.full_name ?? "-"} —{" "}
              {invoice.academic_year?.name ?? "-"}
            </p>
          </div>
          <div className="col-12 col-md-4 text-md-end mt-2 mt-md-0">
            <Link to="/invoices" className="btn btn-light-secondary me-2">
              <i className="bi bi-arrow-left me-1"></i> Kembali
            </Link>

            {canCancel && (
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Membatalkan...
                  </>
                ) : (
                  <>
                    <i className="bi bi-x-circle me-1"></i> Batalkan Invoice
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">
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

      {/* Info Invoice */}
      <section className="section mb-3">
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col-md-3 col-6 mb-2">
                <small className="text-muted d-block">Status</small>
                <span className={`badge ${s.class}`}> {s.label}</span>
              </div>
              <div className="col-md-3 col-6 mb-2">
                <small className="text-muted d-block">Tanggal Invoice</small>
                <strong>{invoice.invoice_date}</strong>
              </div>
              <div className="col-md-3 col-6 mb-2">
                <small className="text-muted d-block">Jatuh Tempo</small>
                <strong>{invoice.due_date}</strong>
              </div>
              <div className="col-md-3 col-6 mb-2">
                <small className="text-muted d-block">Tahun Ajaran</small>
                <strong>{invoice.academic_year?.name ?? "-"}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Items */}
      <section className="section mb-3">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title mb-0">Item Biaya</h4>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nama Item</th>
                    <th className="text-end">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items ?? []).map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{item.fee_name}</td>
                      <td className="text-end">{formatRupiah(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="text-end">
                      Subtotal
                    </td>
                    <td className="text-end">
                      {formatRupiah(invoice.subtotal)}
                    </td>
                  </tr>
                  {invoice.discount && invoice.discount.amount > 0 && (
                    <tr>
                      <td colSpan={2} className="text-end">
                        Diskon
                        {invoice.discount.type === "percentage" &&
                          invoice.discount.rate != null && (
                            <> ({invoice.discount.rate}%)</>
                          )}
                      </td>
                      <td className="text-end text-danger">
                        -{formatRupiah(invoice.discount.amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="fw-bold">
                    <td colSpan={2} className="text-end">
                      Total
                    </td>
                    <td className="text-end">
                      {formatRupiah(invoice.total_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="text-end">
                      Terbayar
                    </td>
                    <td className="text-end text-success">
                      {formatRupiah(invoice.paid_amount)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="text-end">
                      Sisa Tunggakan
                    </td>
                    <td className="text-end text-danger">
                      {formatRupiah(invoice.outstanding_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* payments */}
      <section className="section mb-3">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title mb-0">Riwayat Pembayaran</h4>
          </div>
          <div className="card-body">
            {(invoice.payments ?? []).length === 0 ? (
              <p className="text-muted mb-0">Belum ada pembayaran.</p>
            ) : (
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>No. Kuitansi</th>
                      <th>Tanggal</th>
                      <th>Metode</th>
                      <th className="text-end">Nominal</th>
                      <th>Status</th>
                      <th>Petugas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-bold">{p.receipt_number}</td>
                        <td>
                          {new Date(p.payment_date).toLocaleDateString("id-ID")}
                        </td>
                        <td>{p.payment_method}</td>
                        <td className="text-end">{formatRupiah(p.amount)}</td>
                        <td>
                          {p.status === "completed" ? (
                            <span className="badge bg-success">Lunas</span>
                          ) : (
                            <span className="badge bg-danger">Void</span>
                          )}
                        </td>
                        <td>{p.recorded_by?.name ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
