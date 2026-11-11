import { useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../utils/api";

const EMPTY_FORM = {
  name: "",
  default_amount: "",
  is_active: true,
};

export default function FeeComponentForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});
    setIsSubmitting(true);

    // default_amount harus numeric, kirim sebagai number
    const payload = {
      ...formData,
      default_amount:
        formData.default_amount === "" ? null : Number(formData.default_amount),
    };

    try {
      await api.post("/fee-components", payload);
      navigate("/fee-components", {
        state: { flash: "Komponen biaya berhasil ditambahkan." },
      });
    } catch (error) {
      if (error.response?.status === 422) {
        const data = error.response.data;
        setErrorMessage(data.message || "Validasi gagal.");
        if (data.errors) {
          setFieldErrors(data.errors);
        }
      } else {
        setErrorMessage(
          error.response?.data?.message || "Terjadi kesalahan pada server,",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatPreview(value) {
    if (value === "" || isNaN(Number(value))) {
      return "Rp -";
    }

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value));
  }

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <h3>Tambah Komponen Biaya</h3>
            <p className="text-subtitle text-muted mb-0">
              Tambahkan komponen biaya baru sebagai item tagihan siswa.
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to={"/fee-components"} className="btn btn-light-secondary">
              <i className="bi bi-arrow-left me-1"></i> Kembali
            </Link>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="card">
          <div className="card-body">
            {errorMessage && (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form">
              <div className="row">
                {/* Nama Komponen */}
                <div className="col-md-8 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="name" className="form-label">
                      Nama Komponen Biaya
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                      placeholder="Contoh: SPP November, Uang Gedung, Seragam"
                      maxLength={100}
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.name ? (
                      <div className="invalid-feedback">
                        {fieldErrors.name[0]}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Maks. 100 karakter. Nama ini akan menjadi snapshot pada
                        invoice yang dibuat.
                      </small>
                    )}
                  </div>
                </div>

                {/* Nominal Default */}
                <div className="col-md-4 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="default_amount" className="form-label">
                      Nominal Default (Rp)
                    </label>
                    <input
                      type="text"
                      name="default_amount"
                      id="default_amount"
                      className={`form-control ${fieldErrors.default_amount ? "is-invalid" : ""}`}
                      placeholder="0"
                      min={0}
                      step={1}
                      value={formData.default_amount}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.default_amount ? (
                      <div className="invalid-feedback">
                        {fieldErrors.default_amount[0]}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Preview: {formatPreview(formData.default_amount)}
                      </small>
                    )}
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="col-12">
                  <div className="form-check form-switch mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <label
                      htmlFor="is_active"
                      className="form-check-label fw-bold"
                    >
                      Komponen Aktif
                    </label>
                    <small className="d-block text-muted">
                      Komponen aktif dapat dipilih saat membuat invoice baru.
                    </small>
                  </div>
                </div>

                {/* Info */}
                <div className="col-12">
                  <div className="alert alert-light-secondary mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    <small>
                      <strong>Catatan:</strong> Perubahan master fee component
                      tidak mengubah invoice lama. Setiap invoice menyimpan
                      snapshot
                      <code> fee_name</code> dan <code>amount</code>.
                    </small>
                  </div>
                </div>

                {/* Action */}
                <div className="col-12 d-flex justify-content-end mt-2">
                  <button
                    type="submit"
                    className="btn btn-primary me-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </button>
                  <Link
                    to={"/fee-components"}
                    className="btn btn-light-secondary"
                  >
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
