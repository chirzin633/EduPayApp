import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../utils/api";
import axios from "axios";

const EMPTY_FORM = {
  nis: "",
  full_name: "",
  gender: "L",
  date_of_birth: "",
  phone_number: "",
  address: "",
  parent_name: "",
  parent_phone: "",
  is_active: true,
};

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loadingDetail, setLoadingDetail] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const controller = new AbortController();

    async function fetchStudent() {
      try {
        setLoadingDetail(true);

        const res = await api.get(`/students/${id}`, {
          signal: controller.signal,
        });
        const d = res.data.data;

        setFormData({
          nis: d.nis,
          full_name: d.full_name,
          gender: d.gender,
          date_of_birth: d.date_of_birth,
          phone_number: d.phone_number,
          address: d.address,
          parent_name: d.parent_name,
          parent_phone: d.parent_phone,
          is_active: d.is_active,
        });
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Siswa tidak ditemukan");
        } else {
          setErrorMessage("Gagal memuat detail siswa.");
        }
      } finally {
        setLoadingDetail(false);
      }
    }

    fetchStudent();
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

    // bersihkan field opsional yg kosong agar tidak mengirim string
    const payload = {
      ...formData,
      date_of_birth: formData.date_of_birth || null,
      phone_number: formData.phone_number || null,
      address: formData.address || null,
      parent_name: formData.parent_name || null,
      parent_phone: formData.parent_phone || null,
    };

    try {
      if (isEditing) {
        await api.put(`/students/${id}`, payload);
        navigate("/students", {
          state: { flash: "Data siswa berhasil diperbaharui" },
        });
      } else {
        await api.post("/students", payload);
        navigate("/students", {
          state: { flash: "Data siswa berhasil ditambahkan." },
        });
      }
    } catch (error) {
      if (error.response?.status === 422) {
        const data = error.response.data;
        setErrorMessage(data.message || "Validasi gagal");
        if (data.errors) {
          setFieldErrors(data.errors);
        }
      } else {
        setErrorMessage(
          error.response?.data?.message || "Terjadi kesalahan pada server.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingDetail) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <h3>{isEditing ? "Edit Data Siswa" : "Tambah Siswa"}</h3>
            <p className="text-subtitle text-muted mb-0">
              {isEditing
                ? "Perbaharui data siswa"
                : "Daftarkan siswa baru ke sistem."}
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to={"/students"} className="btn btn-light-secondary">
              <i className="i bi-arrow-left me-1"></i> Kembali
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

      <form onSubmit={handleSubmit}>
        {/* ==== Section: Identitas Siswa ==== */}
        <section className="section mb-3">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-person-vcard me-2"></i> Identitas Siswa
              </h4>
            </div>

            <div className="card-body">
              <div className="row">
                {/* NIS */}
                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="nis" className="form-label">
                      NIS (Nomor Induk Siswa)
                    </label>
                    <input
                      type="text"
                      id="nis"
                      name="nis"
                      className={`form-control ${fieldErrors.nis ? "is-invalid" : ""}`}
                      placeholder="Contoh: 20260001"
                      maxLength={50}
                      value={formData.nis}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.nis ? (
                      <div className="invalid-feedback">
                        {fieldErrors.nis[0]}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Maks. 50 karakter, harus unik.
                      </small>
                    )}
                  </div>
                </div>

                {/* Nama Lengkap */}
                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="full_name" className="form-label">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      className={`form-control ${fieldErrors.full_name ? "is-invalid" : ""}`}
                      placeholder="Contoh: Budi Santoso"
                      maxLength={255}
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                    />
                    {fieldErrors.full_name && (
                      <div className="invalid-feedback">
                        {fieldErrors.full_name[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Gender */}
                <div className="col-md-4 col-12">
                  <div className="form-group mandatory mb-3">
                    <label className="form-label d-block">Jenis Kelamin</label>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        id="gender_L"
                        name="gender"
                        className="form-check-input"
                        value="L"
                        onChange={handleInputChange}
                        checked={formData.gender === "L"}
                      />
                      <label className="form-check-label" htmlFor="gender_L">
                        Laki-laki
                      </label>
                    </div>
                    <div className="form-check form-check-inline">
                      <input
                        type="radio"
                        id="gender_P"
                        name="gender"
                        className="form-check-input"
                        value="P"
                        onChange={handleInputChange}
                        checked={formData.gender === "P"}
                      />
                      <label className="form-check-label" htmlFor="gender_P">
                        Perempuan
                      </label>
                    </div>
                    {fieldErrors.gender && (
                      <div className="text-danger small mt-1">
                        {fieldErrors.gender[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tanggal Lahir */}
                <div className="col-md-4 col-12">
                  <div className="form-group mb-3">
                    <label htmlFor="date_of_birth" className="form-label">
                      Tanggal Lahir{" "}
                      <small className="text-muted">(optional)</small>
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      className={`form-control ${fieldErrors.date_of_birth ? "is-invalid" : ""}`}
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.date_of_birth && (
                      <div className="invalid-feedback">
                        {fieldErrors.date_of_birth[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Aktif */}
                <div className="col-md-4 col-12 d-flex align-items-center">
                  <div className="form-check form-switch mt-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      className="form-check-input"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <label
                      htmlFor="is_active"
                      className="form-check-label fw-bold"
                    >
                      Siswa Aktif
                    </label>
                    <small className="d-block text-muted">
                      Siswa non-aktif tidak dapat menerima invoice baru.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==== Section: Kontak ==== */}
        <section className="section mb-3">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-telephone  me-2"></i> Kontak & Alamat
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                {/* No. HP Siswa */}
                <div className="col-md-4 col-12">
                  <div className="form-group mb-3">
                    <label htmlFor="phone_number" className="form-label">
                      No. HP Siswa{" "}
                      <small className="text-muted">(opsional)</small>
                    </label>
                    <input
                      type="text"
                      id="phone_number"
                      name="phone_number"
                      className={`form-control ${fieldErrors.phone_number ? "is-invalid" : ""}`}
                      placeholder="081234567890"
                      maxLength={20}
                      value={formData.phone_number}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.phone_number && (
                      <div className="invalid-feedback">
                        {fieldErrors.phone_number[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Alamat */}
                <div className="col-md-8 col-12">
                  <div className="form-group mb-3">
                    <label htmlFor="address" className="form-label">
                      Alamat <small className="text-muted">(opsional)</small>
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      className={`form-control ${fieldErrors.address ? "is-invalid" : ""}`}
                      placeholder="Jl. Contoh No. 1, Kota..."
                      rows={2}
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.address && (
                      <div className="invalid-feedback">
                        {fieldErrors.address[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==== Section: Orang Tua / Wali ==== */}
        <section className="section mb-3">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-people me-2"></i> Orang Tua / Wali
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Nama Orang Tua */}
                <div className="col-md-6 col-12">
                  <div className="form-group mb-3">
                    <label htmlFor="parent_name" className="form-label">
                      Nama Orang Tua / Wali{" "}
                      <small className="text-muted">(opsional)</small>
                    </label>
                    <input
                      type="text"
                      id="parent_name"
                      name="parent_name"
                      className={`form-control ${fieldErrors.parent_name ? "is-invalid" : ""}`}
                      placeholder="Contoh: Santoso"
                      maxLength={255}
                      value={formData.parent_name}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.parent_name && (
                      <div className="invalid-feedback">
                        {fieldErrors.parent_name[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* No.HP Orang Tua */}
                <div className="col-md-6 col-12">
                  <div className="form-group mb-3">
                    <label htmlFor="parent_phone" className="form-label">
                      No. HP Orang Tua / Wali{" "}
                      <small className="text-muted">(opsional)</small>
                    </label>
                    <input
                      type="text"
                      id="parent_phone"
                      name="parent_phone"
                      className={`form-control ${fieldErrors.parent_phone ? "is-invalid" : ""}`}
                      placeholder="081234567891"
                      maxLength={20}
                      value={formData.parent_phone}
                      onChange={handleInputChange}
                    />
                    {fieldErrors.parent_phone && (
                      <div className="invalid-feedback">
                        {fieldErrors.parent_phone[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action */}
        <div className="d-flex justify-content-end">
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
          <Link to={"/students"} className="btn btn-light-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
