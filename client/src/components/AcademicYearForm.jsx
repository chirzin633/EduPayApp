import { data, Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import api from "../utils/api";
import axios from "axios";

const EMPTY_FORM = {
  name: "",
  start_date: "",
  end_date: "",
  is_active: false,
};

export default function AcademicYearsForm() {
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

    async function fetchAcademicYear() {
      try {
        setLoadingDetail(true);
        const res = await api.get(`/academic-years/${id}`, {
          signal: controller.signal,
        });
        const d = res.data.data;

        setFormData({
          name: d.name,
          start_date: d.start_date,
          end_date: d.end_date,
          is_active: d.is_active,
        });
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Tahun ajaran tidak ditemukan.");
        } else {
          setErrorMessage("Gagal memuat detail tahun ajaran");
        }
      } finally {
        setLoadingDetail(false);
      }
    }

    fetchAcademicYear();

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
        await api.put(`/academic-years/${id}`, formData);
        navigate("/academic-years", {
          state: { flash: "Tahun ajaran berhasil diperbaharui" },
        });
      } else {
        await api.post("/academic-years", formData);
        navigate("/academic-years", {
          state: { flash: "Tahun ajaran berhasil ditambahkan." },
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
            <h3>{isEditing ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran"}</h3>
            <p className="text-subtitle text-muted mb-0">
              {isEditing
                ? "Perbarui data tahun ajaran."
                : "Tambahkan periode tahun ajaran baru."}
            </p>
          </div>

          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to={"/academic-years"} className="btn btn-light-secondary">
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
                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="name" className="form-label">
                      Nama Tahun Ajaran
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                      placeholder="Contoh: 2026/2027"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.name && (
                      <div className="invalid-feedback">
                        {fieldErrors.name[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6 col-12 d-flex align-items-center">
                  <div className="form-check form-switch mt-3">
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
                      Set Sebagai Tahun Ajaran Aktif
                    </label>
                    <small className="d-block text-muted">
                      (Mengaktifkan ini akan otomatis menonaktifkan tahun ajaran
                      lainnya)
                    </small>
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="start_date" className="form-label">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      className={`form-control ${fieldErrors.start_date ? "is-invalid" : ""}`}
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.start_date && (
                      <div className="invalid-feedback">
                        {fieldErrors.start_date[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="end_date" className="form-label">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      className={`form-control ${fieldErrors.end_date ? "is-invalid" : ""}`}
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.end_date && (
                      <div className="invalid-feedback">
                        {fieldErrors.end_date[0]}
                      </div>
                    )}
                  </div>
                </div>

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
                  <Link
                    to="/academic-years"
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
