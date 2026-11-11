import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../utils/api";
import axios from "axios";

const EMPTY_FORM = {
  code: "",
  name: "",
  is_active: true,
};

export default function ClassForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loadingDetail, setLoadingDetail] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // load detail saat edit
  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const controller = new AbortController();

    async function fetchClasses() {
      try {
        setLoadingDetail(true);

        const res = await api.get(`/classes/${id}`, {
          signal: controller.signal,
        });
        const d = res.data.data;

        setFormData({
          code: d.code,
          name: d.name,
          is_active: d.is_active,
        });
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Kelas tidak ditemukan.");
        } else {
          setErrorMessage("Gagal memuat detail kelas.");
        }
      } finally {
        setLoadingDetail(false);
      }
    }

    fetchClasses();

    return () => controller.abort();
  }, [id, isEditing]);

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

    try {
      if (isEditing) {
        await api.put(`/classes/${id}`, formData);
        navigate("/classes", {
          state: { flash: "Kelas berhasil diperbaharui." },
        });
      } else {
        await api.post("/classes", formData);
        navigate("/classes", {
          state: { flash: "Kelas berhasil ditambahkan" },
        });
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const data = error.response.data;
        setErrorMessage(data.message || "Validasi gagal.");

        if (data.errors) {
          setFieldErrors(data.errors);
        }
      } else {
        error.response?.data?.message || "Terjadi kesalahan pada server.";
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingDetail) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <h3>{isEditing ? "Edit Kelas" : "Tambah Kelas"}</h3>
            <p className="text-subtitle text-muted mb-0">
              {isEditing
                ? "Perbarui data kelas."
                : "Tambahkan kelas baru untuk penempatan siswa."}
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to={"/classes"} className="btn btn-light-secondary">
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
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{" "}
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form">
              <div className="row">
                {/* Kode Kelas */}
                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="code" className="form-label">
                      Kode Kelas
                    </label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      className={`form-control ${fieldErrors.code ? "is-invalid" : ""}`}
                      placeholder="Contoh: X-IPA-1"
                      maxLength={20}
                      value={formData.code}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.code ? (
                      <div className="invalid-feedback">
                        {fieldErrors.code[0]}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Maks. 20 karakter, harus unik.
                      </small>
                    )}
                  </div>
                </div>

                {/* Nama Kelas */}
                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="name" className="form-label">
                      Nama Kelas
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                      placeholder="Contoh: X IPA 1"
                      maxLength={20}
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.name ? (
                      <div className="invalid-feedback">
                        {fieldErrors.name[0]}
                      </div>
                    ) : (
                      <small className="text-muted">Maks. 100 karakter.</small>
                    )}
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="col-12">
                  <div className="form-check form-switch mb-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      className="form-check-input"
                      placeholder="Contoh: X IPA 1"
                      maxLength={20}
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <label
                      htmlFor="is_active"
                      className="form-check-label fw-bold"
                    >
                      Kelas Aktif
                    </label>
                    <small className="d-block text-muted">
                      Kelas non-aktif tidak dapat dipilih untuk penempatan siswa
                      baru, tetapi histori tetap tersimpan.
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
                    ) : isEditing ? (
                      "Update"
                    ) : (
                      "Simpan"
                    )}
                  </button>
                  <Link to={"/classes"} className="btn btn-light-secondary">
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
