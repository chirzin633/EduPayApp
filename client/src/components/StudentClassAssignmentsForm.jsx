import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../utils/api";
import axios from "axios";

const EMPTY_FORM = {
  student_id: "",
  academic_year_id: "",
  class_id: "",
};

export default function StudentClassAssignmentsForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // master data
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Siswa yang sudah punya assignment di tahun ajaran terpilih
  // (untuk validasi klien; backend tetap menjadi sumber kebenaran)
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // load master data
  useEffect(() => {
    const controller = new AbortController();

    async function fetchMasterData() {
      try {
        setLoadingMaster(true);

        const [stuRes, ayRes, clsRes] = await Promise.all([
          api.get("/students?per_page=100&is_active=true", {
            signal: controller.signal,
          }),
          api.get("/academic-years?per_page=100&is_active=true", {
            signal: controller.signal,
          }),
          api.get("/classes?per_page=100&is_active=true", {
            signal: controller.signal,
          }),
        ]);

        setStudents(stuRes.data.data);
        setAcademicYears(ayRes.data.data);
        setClasses(clsRes.data.data);

        const activeYear = ayRes.data.data.find((ay) => ay.is_active);

        if (activeYear) {
          setFormData((prev) => ({
            ...prev,
            academic_year_id: String(activeYear.id),
          }));
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        setErrorMessage("Gagal memuat master data. Coba muat ulang halaman.");
      } finally {
        setLoadingMaster(false);
      }
    }
    fetchMasterData();

    return () => controller.abort();
  }, []);

  // Ketika tahun ajaran dipilih, ambil assignment yang sudah ada di tahun itu
  // agar siswa yang sudah ditempatkan bisa kita disable di dropdown.
  useEffect(() => {
    if (!formData.academic_year_id) {
      setExistingAssignments([]);
      return;
    }

    const controller = new AbortController();

    async function fetchExistingAssignments() {
      try {
        setLoadingExisting(true);
        const res = await api.get(
          `/student-class-assignments?academic_year_id=${formData.academic_year_id}&per_page=100`,
          { signal: controller.signal },
        );
        setExistingAssignments(res.data.data);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        setExistingAssignments([]);
      } finally {
        setLoadingExisting(false);
      }
    }
    fetchExistingAssignments();
    return () => controller.abort();
  }, [formData.academic_year_id]);

  const assignedStudentIds = useMemo(
    () =>
      new Set(existingAssignments.map((a) => a.student_id ?? a.student?.id)),
    [existingAssignments],
  );

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});
    setIsSubmitting(true);

    // Validasi klien cepat
    if (assignedStudentIds.has(Number(formData.student_id))) {
      const studentObj = students.find(
        (student) => student.id === Number(formData.student_id),
      );
      setErrorMessage(
        `Siswa ${studentObj?.full_name ?? ""} sudah memiliki penempatan kelas di tahun ajaran ini.`,
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await api.post("/student-class-assignments", {
        student_id: Number(formData.student_id),
        academic_year_id: Number(formData.academic_year_id),
        class_id: Number(formData.class_id),
      });

      navigate("/student-class-assignments", {
        state: { flash: "Penempatan siswa berhasil ditambahkan." },
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

  // Preview siswa & kelas yang dipilih
  const selectedStudent = students.find(
    (student) => student.id === Number(formData.student_id),
  );
  const selectedClass = classes.find((c) => c.id === Number(formData.class_id));
  const selectedYear = academicYears.find(
    (academicYear) => academicYear.id === Number(formData.academic_year_id),
  );

  if (loadingMaster) {
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
            <h3>Tambah Penempatan kelas</h3>
            <p className="text-subtitle text-muted mb-0">
              Tempatkan siswa ke kelas untuk tahun ajaran tertentu.
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to="/student-class-assignments" className="btn btn-primary">
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

      {/* peringatan jika master data kosong */}
      {(!academicYears.length || !classes.length || !students.length) && (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Pastikan sudah ada <strong>tahun ajaran aktif</strong>,{" "}
          <strong>kelas aktif</strong>, dan <strong>siswa aktif</strong> sebelum
          membuat penempatan.
        </div>
      )}

      <section className="section">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="form">
              <div className="row">
                {/* Tahun Ajaran */}
                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="academic_year_id" className="form-label">
                      Tahun Ajaran
                    </label>
                    <select
                      id="academic_year_id"
                      name="academic_year_id"
                      className={`form-select ${fieldErrors.academic_year_id ? "is-invalid" : ""}`}
                      value={formData.academic_year_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">— Pilih Tahun Ajaran —</option>
                      {academicYears.map((academicYear) => (
                        <option key={academicYear.id} value={academicYear.id}>
                          {academicYear.name}
                          {academicYear.is_active ? " (aktif)" : ""}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.academic_year_id && (
                      <div className="invalid-feedback">
                        {fieldErrors.academic_year_id[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Kelas */}
                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="class_id" className="form-label">
                      Kelas
                    </label>
                    <select
                      id="class_id"
                      name="class_id"
                      className={`form-select ${fieldErrors.class_id ? "is-invalid" : ""}`}
                      value={formData.class_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">— Pilih Kelas —</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.class_id && (
                      <div className="invalid-feedback">
                        {fieldErrors.class_id[0]}
                      </div>
                    )}
                  </div>
                </div>

                {/* Siswa */}
                <div className="col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="student_id" className="form-label">
                      Siswa
                    </label>
                    <select
                      id="student_id"
                      name="student_id"
                      className={`form-select ${fieldErrors.student_id ? "is-invalid" : ""}`}
                      value={formData.student_id}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.academic_year_id || loadingExisting}
                    >
                      <option value="">
                        {!formData.academic_year_id
                          ? "— Pilih tahun ajaran terlebih dahulu —"
                          : loadingExisting
                            ? "Memuat data siswa..."
                            : "— Pilih Siswa —"}
                      </option>
                      {students.map((student) => {
                        const alreadyAssigned = assignedStudentIds.has(
                          student.id,
                        );
                        return (
                          <option
                            key={student.id}
                            value={student.id}
                            disabled={alreadyAssigned}
                          >
                            {student.nis} — {student.full_name}
                            {alreadyAssigned ? " (sudah ditempatkan)" : ""}
                          </option>
                        );
                      })}
                    </select>
                    {fieldErrors.student_id ? (
                      <div className="invalid-feedback">
                        {fieldErrors.student_id[0]}
                      </div>
                    ) : (
                      <small className="text-muted">
                        Siswa yang sudah memiliki penempatan di tahun ajaran
                        terpilih akan ditandai dan tidak dapat dipilih.
                      </small>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {selectedStudent && selectedClass && selectedYear && (
                  <div className="col-12">
                    <div className="alert alert-light-success">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      <strong>Ringkasan penempatan:</strong>{" "}
                      <strong>{selectedStudent.full_name}</strong> (NIS{" "}
                      {selectedStudent.nis}) akan ditempatkan di{" "}
                      <strong>
                        {selectedClass.code} - {selectedClass.name}
                      </strong>{" "}
                      untuk tahun ajaran <strong>{selectedYear.name}</strong>
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
                      !formData.student_id ||
                      !formData.academic_year_id ||
                      !formData.class_id ||
                      loadingExisting
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Penempatan"
                    )}
                  </button>
                  <Link
                    to={"/student-class-assignments"}
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
