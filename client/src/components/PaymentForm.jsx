import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../utils/api";
import axios from "axios";

const EMPTY_FORM = {
  invoice_id: "",
  payment_date: new Date().toISOString().slice(0, 10),
  amount: "",
  payment_method: "cash",
};

const METHODS = [
  { value: "cash", label: "Tunai" },
  { value: "bank_transfer", label: "Transfer Bank" },
  { value: "qris", label: "QRIS" },
  { value: "debit_edc", label: "EDC Debit" },
];

export default function PaymentForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchInvoices() {
      try {
        setLoadingInvoices(true);
        const [unpaidRes, partialRes] = await Promise.all([
          api.get("/invoices", {
            signal: controller.signal,
            params: {
              status: "unpaid",
              per_page: 100,
            },
          }),
          api.get("/invoices", {
            signal: controller.signal,
            params: {
              status: "partially_paid",
              per_page: 100,
            },
          }),
        ]);

        const combined = [
          ...(unpaidRes.data.data ?? []),
          ...(partialRes.data.data ?? []),
        ];
        setInvoices(combined);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        setErrorMessage("Gagal memuat daftar invoice yang dapat dibayar.");
      } finally {
        setLoadingInvoices(false);
      }
    }

    fetchInvoices();
    return () => {
      controller.abort();
    };
  });

  const selectedInvoice = useMemo(
    () =>
      invoices.find((invoice) => String(invoice.id) === formData.invoice_id),
    [invoices, formData.invoice_id],
  );

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleInvoiceChange(e) {
    const id = e.target.value;
    const inv = invoices.find((invoice) => String(invoice.id) === id);
    setFormData((prev) => ({
      ...prev,
      invoice_id: id,
      // Auto-isi nominal dengan sisa tunggakan; admin bisa ubah (partial)
      amount: inv ? String(inv.outstanding_amount) : "",
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const amountNum = Number(formData.amount);

    if (!formData.invoice_id) {
      setErrorMessage("Pilih invoice terlebih dahulu.");
      return;
    }

    if (!formData.payment_date) {
      setErrorMessage("Tanggal pembayaran wajib diisi.");
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage("Nominal harus lebih besar dari 0.");
      return;
    }

    if (selectedInvoice && amountNum > selectedInvoice.outstanding_amount) {
      setErrorMessage("Nominal pembayaran melebihi sisa tunggakan tagihan.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/payments", {
        invoices_id: Number(formData.invoice_id),
        payment_date: formData.payment_date,
        amount: amountNum,
        payment_method: formData.payment_method,
      });
      navigate("/payments", {
        state: { flash: "Pembayaran berhasil dicatat." },
      });
    } catch (error) {
      if (error.response?.status === 422) {
        const data = error.response.data;
        setErrorMessage(data.message || "Validasi gagal.");
        if (data.errors) setFieldErrors(data.errors);
      } else {
        setErrorMessage(
          error.response?.data?.message || "Terjadi kesalahan pada server.",
        );
      }
    } finally {
      setIsSubmitting(false);
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
            <h3>Catat Pembayaran</h3>
            <p className="text-subtitle text-muted mb-0">
              Rekam pembayaran penuh atau sebagian untuk invoice siswa.
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to="/payments" className="btn btn-light-secondary">
              <i className="bi bi-arrow-left me-1"></i> Kembali
            </Link>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
        </div>
      )}

      {!loadingInvoices && invoices.length === 0 && (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Tidak ada invoice yang dapat dibayar saat ini (semua lunas atau
          dibatalkan).
        </div>
      )}

      <section className="section">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="form">
              <div className="row">
                {/* Invoice */}
                <div className="col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="invoice_id" className="form-label">
                      Invoice
                    </label>
                    <select
                      name="invoice_id"
                      id="invoice_id"
                      className={`form-select ${fieldErrors.invoice_id ? "is-invalid" : ""}`}
                      value={formData.invoice_id}
                      onChange={handleInvoiceChange}
                      disabled={loadingInvoices}
                      required
                    >
                      <option value="">
                        {loadingInvoices
                          ? "Memuat invoice..."
                          : "— Pilih Invoice —"}
                      </option>
                      {invoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} —{" "}
                          {inv.student?.full_name ?? "-"} (sisa:{" "}
                          {formatRupiah(invoice.outstanding_amount)})
                        </option>
                      ))}
                    </select>
                    {fieldErrors.invoice_id && (
                      <div className="invalid-feedback">
                        {fieldErrors.invoice_id[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info invoice terpilih */}
                {selectedInvoice && (
                  <div className="col-12">
                    <div className="alert alert-light-primary mb-3">
                      <div className="row">
                        <div className="col-md-3 col-6">
                          <small className="text-muted d-block">Siswa</small>
                          <strong>
                            {selectedInvoice.student?.full_name ?? "-"}
                          </strong>
                        </div>
                        <div className="col-md-3 col-6">
                          <small className="text-muted d-block">
                            Total Tagihan
                          </small>
                          <strong>
                            {formatRupiah(selectedInvoice.paid_amount)}
                          </strong>
                        </div>
                        <div className="col-md-3 col-6">
                          <small className="text-muted d-block">
                            Sisa Tunggakan
                          </small>
                          <strong className="text-danger">
                            {formatRupiah(selectedInvoice.outstanding_amount)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tanggal */}
                <div className="col-md-4 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="payment_date" className="form-label">
                      Tanggal Pembayaran
                    </label>
                    <input
                      type="date"
                      id="payment_date"
                      name="payment_date"
                      className={`form-control ${fieldErrors.payment_date ? "is-invalid" : ""}`}
                      value={formData.payment_date}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.payment_date && (
                      <div className="invalid-feedback">
                        {fieldErrors.payment_date[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="col-md-4 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="amount" className="form-label">
                      Nominal (Rp)
                    </label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      className={`form-control ${fieldErrors.amount ? "is-invalid" : ""}`}
                      min={1}
                      step={1}
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0"
                      required
                    />
                    {fieldErrors.amount ? (
                      <div className="invalid-feedback">
                        {fieldErrors.amount[0]}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Maks.{" "}
                        {selectedInvoice
                          ? formatRupiah(selectedInvoice.outstanding_amount)
                          : "-"}
                      </small>
                    )}
                  </div>
                </div>

                {/* Method */}
                <div className="col-md-4 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="payment_method" className="form-label">
                      Metode Pembayaran
                    </label>
                    <select
                      name="payment_method"
                      id="payment_method"
                      className={`form-select ${fieldErrors.payment_date ? "is-invalid" : ""}`}
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      required
                    >
                      {METHODS.map((method) => (
                        <option value={method.value} key={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.payment_method && (
                      <div className="invalid-feedback">
                        {fieldErrors.payment_method[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview sisa setelah bayar */}
                {selectedInvoice && Number(formData.amount) > 0 && (
                  <div className="col-12">
                    <div className="alert alert-light-secondary mb-3">
                      <small>
                        Setelah pembayaran ini, sisa tunggakan diperkirakan:{" "}
                        <strong>
                          {formatRupiah(
                            Math.max(
                              0,
                              selectedInvoice.outstanding_amount -
                                Number(formData.amount || 0),
                            ),
                          )}
                        </strong>
                        . Angka final dihitung oleh server.
                      </small>
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="col-12 d-flex justify-content-end mt-2">
                  <button
                    type="submit"
                    className="btn btn-primary me-2"
                    disabled={
                      isSubmitting ||
                      loadingInvoices ||
                      !formData.invoice_id ||
                      invoices.length === 0
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Pembayaran"
                    )}
                  </button>
                  <Link to="/payments" className="btn btn-light-secondary">
                    Batal
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
