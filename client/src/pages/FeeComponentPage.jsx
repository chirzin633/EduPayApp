import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import api from "../utils/api";

export default function FeeComponentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [feeComponents, setFeeComponents] = useState([]);
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

  async function fetchFeeComponents(page = 1, appliedFilter = filter) {
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      if (appliedFilter.is_active !== "") {
        params.append("is_active", appliedFilter.is_active);
      }

      const res = await api.get(`/fee-components?${params.toString()}`);
      setFeeComponents(res.data.data);
      setPagination({
        current_page: res.data.meta.current_page,
        last_page: res.data.meta.last_page,
      });
    } catch {
      setErrorMessage("Gagal memuat data komponen biaya");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFeeComponents();
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
    fetchFeeComponents(1, filter);
  }

  function resetFilter() {
    const empty = { is_active: "", search: "" };
    setFilter(empty);
    fetchFeeComponents(1, empty);
  }

  // Filter search di sisi klien
  const visibleFeeComponents = filter.search
    ? feeComponents.filter((f) =>
        f.name.toLowerCase().includes(filter.search.toLowerCase()),
      )
    : feeComponents;

  function formatRupiah(value) {
    if (value === null || value === undefined) {
      return "-";
    }

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
            <h3>Kelola Komponen Biaya</h3>
            <p className="text-subtitle text-muted mb-0">
              Master data komponen biaya untuk item tagihan (SPP, ujian, dll).
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-md-0 ">
            <Link to={"/fee-components/create"} className="btn btn-primary">
              <i className="bi bi-plus-lg me-1"></i> Tambah Komponen
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

      {/* Catatan gap fitur */}
      <div className="alert alert-info">
        <i className="bi bi-info-circle-fill me-2"></i>
        <strong>Catatan:</strong> Saat ini API hanya mendukung penambahan
        komponen biaya baru. Perubahan atau penonaktifan komponen belum
        tersedia; komponen lama tetap aman tersimpan sebagai snapshot pada
        invoice historis.
      </div>

      <section className="section">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Daftar Komponen Biaya</h4>
          </div>
          <div className="card-body">
            {/* filter */}
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
                  placeholder="Cari nama komponen..."
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
                      <th style={{ width: "60px" }}>#</th>
                      <th>Nama Komponen</th>
                      <th className="text-end">Nominal Default</th>
                      <th>Status</th>
                      <th>Dibuat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFeeComponents.length ? (
                      visibleFeeComponents.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="text-muted">
                            {(pagination.current_page - 1) * 15 + idx + 1}
                          </td>
                          <td className="fw-bold">{item.name}</td>
                          <td className="text-end">
                            {formatRupiah(item.default_amount)}
                          </td>
                          <td>
                            {item.is_active ? (
                              <span className="badge bg-success">Aktif</span>
                            ) : (
                              <span className="badge bg-secondary">
                                Non-Aktif
                              </span>
                            )}
                          </td>
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
                        <td colSpan={5} className="text-center text-muted py-3">
                          Belum ada komponen biaya.
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
                    fetchFeeComponents(pagination.current_page - 1, filter)
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
                    fetchFeeComponents(pagination.current_page + 1, filter)
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
