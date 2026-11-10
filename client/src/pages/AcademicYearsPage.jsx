import { useEffect, useState } from "react";
import api from "../utils/api";
import { Link, useNavigate } from "react-router";

export default function AcademicYearsPage() {
  const navigate = useNavigate();
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // load data tahun ajaran
  async function fetchAcademicYears(page = 1) {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await api.get(`/academic-years?page=${page}`);
      setAcademicYears(res.data.data);
      setPagination({
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
      });
    } catch (error) {
      setErrorMessage("Gagal memuat data tahun ajaran.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAcademicYears();
    // tampilkan pesan sukses bila diarahkan dari form
    const flash = sessionStorage.getItem("academic_years_flash");

    if (flash) {
      setSuccessMessage(flash);
      sessionStorage.removeItem("academic_years_flash");
    }
  }, []);

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <h3>Kelola Tahun Ajaran</h3>
            <p className="text-subtitle text-muted mb-0">
              Manajemen periode tahun ajaran aktif dan histori sekolah.
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to="/academic-years/create" className="btn btn-primary">
              <i className="bi bi-plus-lg me-1"></i> Tambah Tahun Ajaran
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

      <section className="section">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Daftar Tahun Ajaran</h4>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status" />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>Tanggal Mulai</th>
                      <th>Tanggal Selesai</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicYears.length ? (
                      academicYears.map((item) => (
                        <tr key={item.id}>
                          <td className="fw-bold">{item.name}</td>
                          <td>{item.start_date}</td>
                          <td>{item.end_date}</td>
                          <td>
                            {item.is_active ? (
                              <span className="badge bg-success">Aktif</span>
                            ) : (
                              <span className="badge bg-secondary">
                                Non-Aktif
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                navigate(`/academic-years/${item.id}/edit`)
                              }
                            >
                              <i className="bi bi-pencil-square me-1"></i> Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-3">
                          Belum ada data tahun ajaran
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
                    fetchAcademicYears(pagination.current_page - 1)
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
                    fetchAcademicYears(pagination.current_page + 1)
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
