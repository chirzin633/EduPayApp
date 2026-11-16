import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import api from "../../utils/api";
import axios from "axios";

const STATUS_LABELS = {
  unpaid: { label: "Belum Dibayar", class: "bg-secondary" },
  partially_paid: { label: "Sebagian", class: "bg-warning text-dark" },
  paid: { label: "Lunas", class: "bg-success" },
  cancelled: { label: "Dibatalkan", class: "bg-danger" },
};

const METHOD_LABELS = {
  cash: "Tunai",
  bank_transfer: "Transfer Bank",
  qris: "QRIS",
  debit_edc: "EDC Debit",
};

export default function StudentHistoryTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialId = searchParams.get("studentId") ?? "";

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedId, setSelectedId] = useState(initialId);

  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchStudents() {
      try {
        setLoadingStudents(true);

        const res = await api.get("/students", {
          signal: controller.signal,
          params: {
            per_page: 100,
          },
        });

        setStudents(res.data.data);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        setErrorMessage("Gagal memuat daftar siswa.");
      } finally {
        setLoadingStudents(false);
      }
    }

    fetchStudents();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setHistory(null);
      return;
    }

    const controller = new AbortController();

    async function fetchStudentHistory() {
      try {
        setLoading(true);
        setErrorMessage("");

        const res = await api.get(`/reports/student-history/${selectedId}`, {
          signal: controller.signal,
        });

        setHistory(res.data.data);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        if (error.response?.status === 404) {
          setErrorMessage("Siswa tidak ditemukan.");
        } else {
          setErrorMessage("Gagal memuat riwayat siswa.");
        }

        setHistory(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentHistory();
    return () => {
      controller.abort();
    };
  }, [selectedId]);

  function handleSelect(e) {
    const id = e.target.value;
    setSelectedId(id);

    if (id) {
      setSearchParams({ studentId: id }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  function formatRupiah(value) {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  }

  const summary = useMemo(() => {
    if (!history) return null;
    const invoices = history.invoices ?? [];
    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum + (inv.total_amount ?? 0),
      0,
    );

    const totalPaid = invoices.reduce(
      (sum, inv) => sum + (inv.paid_amount ?? 0),
      0,
    );

    const totalOutstanding = invoices.reduce(
      (sum, inv) =>
        inv.status === "cancelled" ? sum : sum + (inv.outstanding_amount ?? 0),
      0,
    );

    return {
      totalInvoices: invoices.length,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
    };
  }, [history]);

  return (
    <div>
      {/* pilih siswa */}
      <div className="row g-2 mb-3">
        <div className="col-md-6 col-12">
          <label className="form-label small mb-0">Pilih Siswa</label>
          <select
            className="form-select"
            value={selectedId}
            onChange={handleSelect}
            disabled={loadingStudents}
          >
            <option value="">
              {loadingStudents ? "Memuat siswa..." : "— Pilih Siswa —"}
            </option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nis} — {s.full_name}
                {s.is_active ? "" : " (non-aktif)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status" />
        </div>
      )}

      {!loading && !selectedId && (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-1"></i>
          Pilih siswa untuk melihat profil, riwayat kelas, dan riwayat tagihan.
        </div>
      )}

      {!loading && history && (
        <>
          {/* Profil siswa */}
          <section className="section mb-3">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-person-vcard me-2"></i> Profil Siswa
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-3 col-6 mb-2">
                    <small className="text-muted d-block">NIS</small>
                    <strong>{history.student?.nis ?? "-"}</strong>
                  </div>
                  <div className="col-md-3 col-6 mb-2">
                    <small className="text-muted d-block">Nama</small>
                    <strong>{history.student?.full_name ?? "-"}</strong>
                  </div>
                  <div className="col-md-3 col-6 mb-2">
                    <small className="text-muted d-block">Gender</small>
                    <strong>
                      {history.student?.gender === "L"
                        ? "Laki-laki"
                        : history.student?.gender === "P"
                          ? "Perempuan"
                          : "-"}
                    </strong>
                  </div>
                  <div className="col-md-3 col-6 mb-2">
                    <small className="text-muted d-block">Status</small>
                    {history.student?.is_active ? (
                      <span className="badge bg-success">Aktif</span>
                    ) : (
                      <span className="badge bg-secondary">Non-Aktif</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Ringkasan */}
          {summary && (
            <div className="card bg-light-primary mb-3">
              <div className="card-body py-3">
                <div className="d-flex flex-wrap gap-4">
                  <div>
                    <small className="text-muted d-block">Total Invoice</small>
                    <strong>{summary.totalInvoices}</strong>
                  </div>
                  <div>
                    <small className="text-muted d-block">Total Tagihan</small>
                    <strong>{formatRupiah(summary.totalInvoiced)}</strong>
                  </div>
                  <div>
                    <small className="text-muted d-block">Total Terbayar</small>
                    <strong className="text-success">
                      {formatRupiah(summary.totalPaid)}
                    </strong>
                  </div>
                  <div>
                    <small className="text-muted d-block">Sisa Tunggakan</small>
                    <strong className="text-danger">
                      {formatRupiah(summary.totalOutstanding)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Riwayat Kelas */}
          <section className="section mb-3">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-diagram-3 me-2"></i> Riwayat Penempatan
                  Kelas
                </h5>
              </div>
              <div className="card-body">
                {(history.class_history ?? []).length === 0 ? (
                  <p className="text-muted mb-0">Belum ada penempatan kelas.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table mb-0">
                      <thead>
                        <tr>
                          <th>Tahun Ajaran</th>
                          <th>Kelas</th>
                          <th>Ditambahkan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.class_history.map((h) => (
                          <tr key={h.id}>
                            <td>{h.academic_year?.name ?? "-"}</td>
                            <td>
                              {h.class_model?.code ?? "-"} —{" "}
                              {h.class_model?.name ?? ""}
                            </td>
                            <td className="text-muted small">
                              {h.created_at
                                ? new Date(h.created_at).toLocaleDateString(
                                    "id-ID",
                                  )
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* invoices & payments */}
          <section className="section mb-3">
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="bi bi-file-earmark-text me-2"></i> Riwayat
                  Tagihan
                </h5>
              </div>
              <div className="card-body">
                {(history.invoices ?? []).length === 0 ? (
                  <p className="text-muted mb-0">Belum ada tagihan.</p>
                ) : (
                  <div className="accordion" id="invoicesAccordion">
                    {history.invoices.map((inv, idx) => {
                      const s = STATUS_LABELS[inv.status] ?? {
                        label: inv.status,
                        class: "bg-secondary",
                      };
                      const collapseId = `inv-collapse-${inv.id}`;
                      return (
                        <div className="accordion-item" key={inv.id}>
                          <h2
                            className="accordion-header"
                            id={`inv-heading-${inv.id}`}
                          >
                            <button
                              className="accordion-button collapsed"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target={`#${collapseId}`}
                              aria-expanded="false"
                              aria-controls={collapseId}
                            >
                              <div className="d-flex justify-content-between w-100 me-3 flex-wrap gap-2">
                                <span className="fw-bold">
                                  {inv.invoice_number}
                                </span>
                                <span className="text-muted small">
                                  {inv.invoice_date} —{" "}
                                  {inv.academic_year?.name ?? "-"}
                                </span>
                                <span className={`badge ${s.class}`}>
                                  {s.label}
                                </span>
                                <span className="text-danger">
                                  Sisa: {formatRupiah(inv.outstanding_amount)}
                                </span>
                              </div>
                            </button>
                          </h2>
                          <div
                            id={collapseId}
                            className="accordion-collapse collapse"
                            aria-labelledby={`inv-heading-${inv.id}`}
                            data-bs-parent="#invoicesAccordion"
                          >
                            <div className="accordion-body">
                              {/* Items */}
                              <h6 className="fw-bold">Item</h6>
                              <table className="table table-sm">
                                <tbody>
                                  {(inv.items ?? []).map((it) => (
                                    <tr key={it.id}>
                                      <td>{it.fee_name}</td>
                                      <td className="text-end">
                                        {formatRupiah(it.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                  {inv.discount?.amount > 0 && (
                                    <tr>
                                      <td>
                                        Diskon
                                        {inv.discount.type === "percentage" &&
                                          inv.discount.rate != null && (
                                            <> ({inv.discount.rate}%)</>
                                          )}
                                      </td>
                                      <td className="text-end text-danger">
                                        -{formatRupiah(inv.discount.amount)}
                                      </td>
                                    </tr>
                                  )}
                                  <tr className="fw-bold">
                                    <td>Total</td>
                                    <td className="text-end">
                                      {formatRupiah(inv.total_amount)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td>Terbayar</td>
                                    <td className="text-end text-success">
                                      {formatRupiah(inv.paid_amount)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>

                              {/* Payments */}
                              <h6 className="fw-bold mt-3">
                                Pembayaran ({(inv.payments ?? []).length})
                              </h6>
                              {(inv.payments ?? []).length === 0 ? (
                                <p className="text-muted small mb-0">
                                  Belum ada pembayaran.
                                </p>
                              ) : (
                                <table className="table table-sm mb-0">
                                  <thead>
                                    <tr>
                                      <th>Kuitansi</th>
                                      <th>Tanggal</th>
                                      <th>Metode</th>
                                      <th className="text-end">Nominal</th>
                                      <th>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inv.payments.map((p) => (
                                      <tr key={p.id}>
                                        <td>{p.receipt_number}</td>
                                        <td>
                                          {new Date(
                                            p.payment_date,
                                          ).toLocaleDateString("id-ID")}
                                        </td>
                                        <td>
                                          {METHOD_LABELS[p.payment_method] ??
                                            p.payment_method}
                                        </td>
                                        <td className="text-end">
                                          {formatRupiah(p.amount)}
                                        </td>
                                        <td>
                                          {p.status === "completed" ? (
                                            <span className="badge bg-success">
                                              Lunas
                                            </span>
                                          ) : (
                                            <span className="badge bg-danger">
                                              Void
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
