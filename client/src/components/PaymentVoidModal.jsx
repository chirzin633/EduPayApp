import { useEffect, useState } from "react";

export default function PaymentVoidModal(props) {
  const { payment, isSubmitting, errorMessage, onClose, onSubmit } = props;

  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (payment) {
      setReason("");
      setValidationError("");
    }
  }, [payment]);

  if (!payment) {
    return null;
  }

  function handleSubmit(e) {
    e.prevenDefault();
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setValidationError("Alasan minimal 5 karakter.");
      return;
    }
    if (trimmed.length > 500) {
      setValidationError("Alasan maksimal 500 karakter.");
      return;
    }
    setValidationError("");
    onSubmit(trimmed);
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        style={{ background: "rgba(0,0,0,.5" }}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  Void Pembayaran
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  disabled={isSubmitting}
                ></button>
              </div>

              <div className="modal-body">
                <p className="mb-2">
                  Kuitansi <strong>{payment.receipt_number}</strong> sebesar{" "}
                  <strong>
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(payment.amount)}
                  </strong>{" "}
                  akan di-void
                </p>

                <p className="text-muted small">
                  Tindakan ini tidak menghapus data. Pembayaran akan dihitung
                  ulang pada status invoice. Tidak dapat diurungkan.
                </p>

                {(errorMessage || validationError) && (
                  <div className="alert alert-danger py-2 mb-2">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                    {validationError || errorMessage}
                  </div>
                )}

                <div className="form-group mb-0">
                  <label htmlFor="void_reason" className="form-label">
                    Alasan Void <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="void_reason"
                    className="form-control"
                    rows={3}
                    maxLength={500}
                    minLength={5}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contoh: Salah input nominal pembayaran."
                    required
                    disabled={isSubmitting}
                  />
                  <small className="text-muted">
                    {reason.length}/500 karakter (min. 5)
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-light-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Memproses...
                    </>
                  ) : (
                    "Void Pembayaran"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Backdrop tambahan agar menutupi seluruh layar */}
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
