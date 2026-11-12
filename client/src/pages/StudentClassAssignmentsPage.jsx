import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import api from "../utils/api";

export default function StudentClassAssignmentsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });

  // filter state
  const [filter, setFilter] = useState({
    academic_year_id: "",
    class_id: "",
    student_id: "",
  });

  // master data untuk dropdown filter
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  async function fetchMasterData() {
    setLoadingMaster(true);
    try {
      const [ayRes, clsRes, stuRes] = await Promise.all([
        api.get("/academic-years?per_page=100"),
        api.get("/classes?per_page=100"),
        api.get("/students?per_page=100&is_active=true"),
      ]);
      setAcademicYears(ayRes.data.data);
      setClasses(clsRes.data.data);
      setStudents(stuRes.data.data);
    } catch {
      console.warn("Gagal memuat master data filter.");
    } finally {
      setLoadingMaster(false);
    }
  }

  async function fetchAssignments(page = 1, appliedFilter = filter) {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("per_page", 15);
      if (appliedFilter.academic_year_id) {
        params.append("academic_year_id", appliedFilter.academic_year_id);
      }
      if (appliedFilter.class_id) {
        params.append("class_id", appliedFilter.class_id);
      }
      if (appliedFilter.student_id) {
        params.append("student_id", appliedFilter.student_id);
      }

      const res = await api.get(
        `/student-class-assignments?${params.toString()}`,
      );
      setAssignments(res.data.data);
      setPagination({
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
      });
    } catch {
      setErrorMessage("Gagal memuat data penempatan siswa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMasterData();
    fetchAssignments();
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
    fetchAssignments(1, filter);
  }

  function resetFilter() {
    const empty = { academic_year_id: "", class_id: "", student_id: "" };
    setFilter(empty);
    fetchAssignments(1, empty);
  }

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-6 ">
            <h3>Penempatan Kelas Siswa</h3>
            <p className="text-subtitle text-muted mb-0">
              Penempatan siswa ke kelas per tahun ajaran. Histori tidak dapat
              diubah.
            </p>
          </div>
          <div className="col col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link
              to="/student-class-assignments/create"
              className="btn btn-primary"
            >
              <i className="bi bi-plus-lg me-1"></i> Tambah Penempatan
            </Link>
          </div>
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

      <div className="alert alert-info">
        <i className="bi bi-info-circle-fill me-2"></i>
        <strong>Catatan:</strong> Setiap siswa hanya boleh memiliki satu
        penempatan per tahun ajaran. Histori penempatan lama tidak dapat diubah
        atau dihapus untuk menjaga integritas data akademik.
      </div>

      <section className="section">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Daftar Penempatan</h4>
          </div>
          <div className="card-body">
            {/* filter */}
            <form onSubmit={applyFilter} className="row g-2 mb-3">
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
                  {academicYears.map((academicYear) => (
                    <option key={academicYear.id} value={academicYear.id}>
                      {academicYear.name}
                      {academicYear.is_active ? " (aktif)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 col-12">
                <select
                  name="class_id"
                  id="class_id"
                  className="form-select"
                  value={filter.class_id}
                  onChange={handleFilterChange}
                  disabled={loadingMaster}
                >
                  <option value="">Semua Siswa</option>
                  {students.map((student) => (
                    <option value={student.id} key={student.id}>
                      {student.nis} - {student.full_name}
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
                      <th style={{ width: "60px" }}>#</th>
                      <th>NIS</th>
                      <th>Nama Siswa</th>
                      <th>Kelas</th>
                      <th>Tahun Ajaran</th>
                      <th>Ditambahkan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.length ? (
                      assignments.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="text-muted">
                            {(pagination.current_page - 1) * 15 + idx + 1}
                          </td>
                          <td className="fw-bold">
                            {item.student?.nis || "-"}
                          </td>
                          <td>{item.student?.full_name || "-"}</td>
                          <td>
                            <span className="badge bg-light-primary text-dark">
                              {item.class?.code || "-"}
                            </span>{" "}
                            {item.class?.name || ""}
                          </td>
                          <td>{item.academic_year?.name || "-"}</td>
                          <td className="text-muted small">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-3">
                          Belum ada data penempatan
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
                    fetchAssignments(pagination.current_page + 1, filter)
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
