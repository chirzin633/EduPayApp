import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import api from "../utils/api";

export default function ClassesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
  });
  const [filter, setFilter] = useState({
    is_active: "",
    search: "",
  });

  async function fetchClasses(page = 1) {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      if (filter.is_active !== "") {
        params.append("is_active", filter.is_active);
      }

      const res = await api.get(`/classes?${params.toString()}`);
      setClasses(res.data.data);
      setPagination({
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
      });
    } catch (error) {
      setErrorMessage("Gagal memuat data kelas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClasses();
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
    fetchClasses();
  }

  function resetFilter() {
    setFilter({
      is_active: "",
      search: "",
    });
    setTimeout(() => fetchClasses(1), 0);
  }

  // Filter search di sisi klien
  const visibleClasses = filter.search
    ? classes.filter(
        (c) =>
          c.code.toLowerCase().includes(filter.search.toLowerCase()) ||
          c.name.toLowerCase().includes(filter.search.toLowerCase()),
      )
    : classes;

  return (
    <div className="page-heading">
      <div className="page-title mb-3">
        <div className="row align-items-center">
          <div className="col-12 col-md-6">
            <h3>Kelola Data Kelas</h3>
            <p className="text-subtitle text-muted mb-0">
              Manajemen kelas untuk penempatan siswa per tahun ajaran.
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to={"/classes/create"} className="btn btn-primary">
              <i className="bi bi-plus-lg me-1"></i> Tambah Kelas
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
            <h4 className="card-title">Daftar Kelas</h4>
          </div>
          <div className="card-body">
            {/* Filter */}
            <form onSubmit={applyFilter} className="row g-2 mb-3">
              <div className="col-md-3 col-12">
                <select
                  name="is_active"
                  id="is_active"
                  className="form-select"
                  value={filter.is_active}
                  onChange={handleFilterChange}
                >
                  <option value="">Semua Status</option>
                  <option value="true">Aktif</option>
                  <option value="false">Non-Aktif</option>
                </select>
              </div>

              <div className="col-md-5 col-12">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="form-control"
                  placeholder="Cari kode atau nama kelas..."
                  value={filter.search}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="col-md-4 col-12">
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
                      <th style={{ width: "80px" }}>#</th>
                      <th>Kode</th>
                      <th>Nama Kelas</th>
                      <th>Status</th>
                      <th style={{ width: "120px" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleClasses ? (
                      visibleClasses.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="text-muted">
                            {(pagination.current_page - 1) * 15 + idx + 1}
                          </td>
                          <td className="fw-bold">{item.code}</td>
                          <td>{item.name}</td>
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
                                navigate(`/classes/${item.id}/edit`)
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
                          Belum ada data kelas
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
                  onClick={() => fetchClasses(pagination.current_page - 1)}
                >
                  Previous
                </button>
                <span className=" align-self-center mx-2 text-muted">
                  Halaman {pagination.current_page} dari {pagination.last_page}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => fetchClasses(pagination.current_page + 1)}
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
