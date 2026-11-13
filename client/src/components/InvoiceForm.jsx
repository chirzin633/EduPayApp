import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../utils/api";
import axios from "axios";

const EMPTY_ITEM = {
  fee_component_id: "",
  fee_name: "",
  amount: "",
};

const EMPTY_FORM = {
  student_id: "",
  student_class_assignment_id: "",
  academic_year_id: "",
  invoice_date: todayISO(),
  due_date: "",
  discount_type: "",
  discount_rate: "",
  discount_amount: "",
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function InvoiceForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // master data
  const [students, setStudents] = useState([]);
  const [feeComponents, setFeeComponents] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // assignment milik siswa terpilih
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // load master data aktif
  useEffect(() => {
    const controller = new AbortController();

    async function fetchMasterData() {
      try {
        setLoadingMaster(true);

        const [stuRes, feeRes] = await Promise.all([
          api.get("/students", {
            signal: controller.signal,
            params: {
              per_page: 100,
              is_active: true,
            },
          }),

          api.get("/fee-components", {
            signal: controller.signal,
            params: {
              per_page: 100,
              is_active: true,
            },
          }),
        ]);

        setStudents(stuRes.data.data);
        setFeeComponents(feeRes.data.data);
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
    return () => {
      controller.abort();
    };
  }, []);

  // load assignment saat siswa dipilih
  useEffect(() => {
    if (!formData.student_id) {
      setAssignments([]);
      setFormData((prev) => ({
        ...prev,
        student_class_assignment_id: "",
        academic_year_id: "",
      }));
      return;
    }

    const controller = new AbortController();

    async function fetchAssignments() {
      try {
        setLoadingAssignments(true);
        const res = await api.get("/student-class-assignments", {
          signal: controller.signal,
          params: {
            student_id: formData.student_id,
            per_page: 100,
          },
        });

        const list = res.data.data;
        setAssignments(list);

        setFormData((prev) => ({
          ...prev,
          student_class_assignment_id: "",
          academic_year_id: "",
        }));

        if (list.length === 1) {
          setFormData((prev) => ({
            student_class_assignment_id: String(list[0].id),
            academic_year_id: String(list[0].academic_year?.id ?? ""),
          }));
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }
        setAssignments([]);
      } finally {
        setLoadingAssignments(false);
      }
    }

    fetchAssignments();
    return () => {
      controller.abort();
    };
  }, [formData.student_id]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleAssignmentsChange(e) {
    const id = e.target.value;
    const found = assignments.find(
      (assignment) => String(assignment.id) === id,
    );
    setFormData((prev) => ({
      ...prev,
      student_class_assignment_id: id,
      academic_year_id: found?.academic_year?.id
        ? String(found.academic_year.id)
        : "",
    }));
  }

  // item handlers
  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // auto-fill dari master fee component
      if (field === "fee_component_id") {
        const fc = feeComponents.find(
          (feeComponent) => String(feeComponent.id) === value,
        );

        if (fc) {
          next[index].fee_name = fc.name;
          next[index].amount = String(fc.default_amount);
        } else {
          next[index].fee_name = "";
          next[index].amount = "";
        }
      }
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // Preview kalkulasi (server tetap hitung ulang)
  const subtotal = useMemo(
    () =>
      items.reduce((sum, it) => {
        const n = Number(it.amount);
        return sum + (isNaN(n) ? 0 : n);
      }, 0),
    [items],
  );

  const discountAmountPreview = useMemo(() => {
    if (formData.discount_type === "percentage") {
      const rate = Number(formData.discount_rate);
      if (isNaN(rate) || rate <= 0) {
        return 0;
      }

      return Math.min(subtotal, Math.round((subtotal * rate) / 100));
    }

    if (formData.discount_type === "fixed_amount") {
      const amt = Number(formData.discount_amount);
      if (isNaN(amt) || amt <= 0) {
        return 0;
      }

      return Math.min(subtotal, amt);
    }

    return 0;
  }, [
    formData.discount_type,
    formData.discount_rate,
    formData.discount_amount,
    subtotal,
  ]);

  const totalPreview = subtotal - discountAmountPreview;

  // submit
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});
    setIsSubmitting(true);

    // validasi klien minimal
    if (!formData.student_id) {
      setErrorMessage("Pilih siswa terlebih dahulu.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.academic_year_id) {
      setErrorMessage("Tahun ajaran tidak terdeteksi dari penempatan.");
      setIsSubmitting(false);
      return;
    }

    if (!formData.due_date) {
      setErrorMessage("Tanggal jatuh tempo wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    const invalidItem = items.find(
      (item) => !item.fee_name || item.amount === "" || Number(item.amount) < 0,
    );

    if (invalidItem) {
      setErrorMessage(
        "Semua item harus memiliki nama dan nominal lebih dari sama dengan 0.",
      );
      setIsSubmitting(false);
      return;
    }

    // payload
    const payload = {
      student_id: Number(formData.student_id),
      student_class_assignment_id: Number(formData.student_class_assignment_id),
      academic_year_id: Number(formData.academic_year_id),
      invoice_date: formData.invoice_date,
      due_date: formData.due_date,
      items: items.map((item) => ({
        fee_component_id: item.fee_component_id
          ? Number(item.fee_component_id)
          : null,
        fee_name: item.fee_name,
        amount: Number(item.amount),
      })),
    };

    if (formData.discount_type === "percentage") {
      payload.discount_type = "percentage";
      payload.discount_rate = Number(formData.discount_rate);
    } else if (formData.discount_type === "fixed_amount") {
      payload.discount_type = "fixed_amount";
      payload.discount_rate = Number(formData.discount_rate);
    }

    try {
      const res = await api.post("/invoices", payload);
      const created = res.data.data;
      navigate(`/invoices/${created.id}`, {
        state: { flash: "Invoice berhasil dibuat." },
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

  function formatRupiah(value) {
    if (value === null || value === undefined || isNaN(value)) return "-";

    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  }

  const selectedStudent = students.find(
    (student) => student.id === Number(formData.student_id),
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
            <h3>Buat Invoice Baru</h3>
            <p className="text-subtitle text-muted mb-0">
              Buat tagihan untuk siswa dengan satu atau lebih komponen biaya.
            </p>
          </div>
          <div className="col-12 col-md-6 text-md-end mt-2 mt-md-0">
            <Link to="/invoices" className="btn btn-light-secondary">
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

      <form onSubmit={handleSubmit}>
        {/*  Section 1: Siswa & Tahun Ajaran */}
        <section className="section mb-3">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-person me-2"></i> Siswa & Tahun Ajaran
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="student_id" className="form-label">
                      Siswa
                    </label>
                    <select
                      name="student_id"
                      id="student_id"
                      className={`form-select ${fieldErrors.student_id ? "is-invalid" : ""}`}
                      value={formData.student_id}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="">— Pilih Siswa —</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.nis} - {student.full_name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.student_id && (
                      <div className="invalid-feedback">
                        {fieldErrors.student_id[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-4 col-12">
                  <div className="form-group mandatory mb-3">
                    <label
                      htmlFor="student_class_assignment_id"
                      className="form-label"
                    >
                      Penempatan Kelas
                    </label>
                    <select
                      name="student_class_assignment_id"
                      id="student_class_assignment_id"
                      className={`form-select ${fieldErrors.student_class_assignment_id ? "is-invalid" : ""}`}
                      value={formData.student_class_assignment_id}
                      onChange={handleAssignmentsChange}
                      required
                      disabled={!formData.student_id || loadingAssignments}
                    >
                      <option value="">
                        {!formData.student_id
                          ? "— Pilih siswa dulu —"
                          : loadingAssignments
                            ? "Memuat..."
                            : assignments.length === 0
                              ? "Siswa belum punya penempatan"
                              : "— Pilih Penempatan —"}
                      </option>
                      {assignments.map((assignment) => (
                        <option key={assignment.id} value={assignment.id}>
                          {assignment.class?.code ?? "-"} -{" "}
                          {assignment.academic_year?.name ?? "-"}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.student_class_assignment_id && (
                      <div className="invalid-feedback">
                        {fieldErrors.student_class_assignment_id[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-4 col-12">
                  <div className="form-group mb-3">
                    <label className="form-label">Tahun Ajaran</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        assignments.find(
                          (assignment) =>
                            String(assignment.id) ===
                            String(formData.student_class_assignment_id),
                        )?.academic_year?.name ?? ""
                      }
                      readOnly
                      placeholder="Otomatis dari penempatan"
                    />
                    <small className="text-muted">
                      Diambil dari penempatan yang dipilih.
                    </small>
                  </div>
                </div>
              </div>

              {formData.student_id &&
                !loadingAssignments &&
                assignments.length === 0 && (
                  <div className="alert alert-warning mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Siswa ini belum memiliki penempatan kelas.{" "}
                    <Link to={"/student-class-assignments/create"}>
                      Buat penempatan dulu
                    </Link>
                    .
                  </div>
                )}
            </div>
          </div>
        </section>

        {/* Section 2: Tanggal */}
        <section className="section mb-3">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-calendar me-2"></i> Tanggal Invoice
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-12 col-md-6">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="invoice_date" className="form-label">
                      Tanggal Invoice
                    </label>
                    <input
                      type="date"
                      id="invoice_date"
                      name="invoice_date"
                      className={`form-control ${fieldErrors.invoice_date ? "is-invalid" : ""}`}
                      value={formData.invoice_date}
                      onChange={handleFormChange}
                      required
                    />
                    {fieldErrors.invoice_date && (
                      <div className="invalid-feedback">
                        {fieldErrors.invoice_date[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="form-group mandatory mb-3">
                    <label htmlFor="due_date" className="form-label">
                      Jatuh Tempo
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      name="due_date"
                      className={`form-control ${fieldErrors.due_date ? "is-invalid" : ""}`}
                      value={formData.due_date}
                      onChange={handleFormChange}
                      min={formData.invoice_date}
                      required
                    />
                    {fieldErrors.due_date && (
                      <div className="invalid-feedback">
                        {fieldErrors.due_date[0]}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Item Biaya */}
        <section className="section mb-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="card-title mb-0">
                <i className="bi bi-list-ul me-2"></i> Item Biaya
              </h4>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addItem}
              >
                <i className="bi bi-plus-lg me-1"></i> Tambah Item
              </button>
            </div>
            <div className="card-body">
              {fieldErrors.items && (
                <div className="alert alert-danger">
                  {typeof fieldErrors.items === "string"
                    ? fieldErrors.items
                    : fieldErrors.items[0]}
                </div>
              )}

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: "30%" }}>Komponen</th>
                      <th>Nama Item (snapshot)</th>
                      <th style={{ width: "180px" }}>Nominal</th>
                      <th style={{ width: "60px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const rowErr =
                        fieldErrors[`items.${idx}.fee_name`] ||
                        fieldErrors[`items.${idx}.amount`];

                      return (
                        <tr key={idx}>
                          <td>
                            <select
                              className="form-select"
                              value={item.fee_component_id}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "fee_component_id",
                                  e.target.value,
                                )
                              }
                            >
                              <option value="">— Manual —</option>
                              {feeComponents.map((fc) => (
                                <option key={fc.id} value={fc.id}>
                                  {fc.name} ({formatRupiah(fc.default_amount)})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              className={`form-control ${rowErr ? "is-invalid" : ""}`}
                              value={item.fee_name}
                              maxLength={255}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "fee_name",
                                  e.target.value,
                                )
                              }
                              placeholder="Nama item"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className={`form-control ${rowErr ? "is-invalid" : ""}`}
                              value={item.amount}
                              min={0}
                              step={1}
                              onChange={(e) =>
                                handleItemChange(idx, "amount", e.target.value)
                              }
                              placeholder="0"
                              required
                            />
                            {rowErr && (
                              <div className="invalid-feedback d-block">
                                {typeof rowErr === "string"
                                  ? rowErr
                                  : rowErr[0]}
                              </div>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeItem(idx)}
                              disabled={items.length === 1}
                              title="Hapus item"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Diskon */}
        <section className="section mb-3">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-percent me-2"></i> Diskon (Opsional)
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 col-12">
                  <div className="form-group mb-3">
                    <label htmlFor="discount_type" className="form-label">
                      Tipe Diskon
                    </label>
                    <select
                      name="discount_type"
                      id="discount_type"
                      className="form-select"
                      value={formData.discount_type}
                      onChange={handleFormChange}
                    >
                      <option value="">Tanpa Diskon</option>
                      <option value="percentage">Persentase (%)</option>
                      <option value="fixed_amount">Nominal (Rp)</option>
                    </select>
                  </div>
                </div>

                {formData.discount_type === "percentage" && (
                  <div className="col-md-4 col-12">
                    <div className="form-group mandatory mb-3">
                      <label htmlFor="discount_rate" className="form-label">
                        Persentase Diskon
                      </label>
                      <input
                        type="number"
                        id="discount_rate"
                        name="discount_rate"
                        className={`form-control ${fieldErrors.discount_rate ? "is-invalid" : ""}`}
                        min={1}
                        max={100}
                        step={1}
                        value={formData.discount_rate}
                        onChange={handleFormChange}
                        required
                      />
                      {fieldErrors.discount_rate && (
                        <div className="invalid-feedback">
                          {fieldErrors.discount_rate[0]}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {formData.discount_type === "fixed_amount" && (
                  <div className="col-md-4 col-12">
                    <div className="form-group mandatory mb-3">
                      <label htmlFor="discount_amount" className="form-label">
                        Nominal Diskon (Rp)
                      </label>
                      <input
                        type="number"
                        id="discount_amount"
                        name="discount_amount"
                        className={`form-control ${fieldErrors.discount_amount ? "is-invalid" : ""}`}
                        min={0}
                        step={1}
                        value={formData.discount_amount}
                        onChange={handleFormChange}
                        required
                      />
                      {fieldErrors.discount_amount && (
                        <div className="invalid-feedback">
                          {fieldErrors.discount_amount[0]}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {formData.discount_type && (
                  <div className="col-md-4 col-12">
                    <div className="form-group mb-3">
                      <label className="form-label">
                        Nilai Diskon (preview)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={formatRupiah(discountAmountPreview)}
                        readOnly
                      />
                      <small className="text-muted">
                        Diskon tidak boleh melebihi subtotal. Server akan
                        memvalidasi ulang.
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Ringkasa */}
        <section className="section mb-3">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title mb-0">
                <i className="bi bi-calculator me-2"></i> Ringkasan
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8 col-12 order-md-1 order-2">
                  {selectedStudent && (
                    <p className="text-muted mb-1">
                      Invoice untuk <strong>{selectedStudent.full_name}</strong>{" "}
                      (NIS {selectedStudent.nis})
                      {formData.student_class_assignment_id && (
                        <>
                          {" "}
                          —{" "}
                          {
                            assignments.find(
                              (a) =>
                                String(a.id) ===
                                formData.student_class_assignment_id,
                            )?.class?.code
                          }
                        </>
                      )}
                    </p>
                  )}
                </div>
                <div className="col-md-4 col-12 order-md-2 order-1">
                  <table className="table table-sm mb-0">
                    <tbody>
                      <tr>
                        <td>Subtotal</td>
                        <td className="text-end">{formatRupiah(subtotal)}</td>
                      </tr>
                      <tr>
                        <td>Diskon</td>
                        <td className="text-end text-danger">
                          -{formatRupiah(discountAmountPreview)}
                        </td>
                      </tr>
                      <tr className="fw-bold">
                        <td>Total</td>
                        <td className="text-end">
                          {formatRupiah(totalPreview)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <small className="text-muted d-block mt-1">
                    * Angka final dihitung oleh server saat disimpan.
                  </small>
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
            ) : (
              "Simpan Invoice"
            )}
          </button>
          <Link to="/invoices" className="btn btn-light-secondary">
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
