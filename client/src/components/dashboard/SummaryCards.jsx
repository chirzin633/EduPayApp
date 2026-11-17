import { formatRupiah } from "../../utils/format";

const CARDS = [
  {
    key: "total_students",
    label: "Total Siswa Aktif",
    icon: "bi-people",
    color: "primary",
    format: (v) => v ?? 0,
  },

  {
    key: "total_revenue",
    label: "Total Pendapatan",
    icon: "bi-cash-stack",
    color: "success",
    format: (v) => formatRupiah(v, true),
  },

  {
    key: "total_outstanding",
    label: "Total Tunggakan",
    icon: "bi-exclamation-triangle",
    color: "danger",
    format: (v) => formatRupiah(v, true),
  },

  {
    key: "unpaid_invoices",
    label: "Invoices Belum Dibayar",
    icon: "bi-file-earmark-x",
    color: "secondary",
    format: (v) => v ?? 0,
  },

  {
    key: "partially_paid_invoices",
    label: "Invoice Sebagian",
    icon: "bi-file-earmark-half",
    color: "warning",
    format: (v) => v ?? 0,
  },

  {
    key: "paid_invoices",
    label: "Invoice Lunas",
    icon: "bi-file-earmark-check",
    color: "success",
    format: (v) => v ?? 0,
  },
];

export default function SummaryCards(props) {
  const { summary } = props;

  if (!summary) {
    return null;
  }

  return (
    <div className="row g-3 mb-3">
      {CARDS.map((card) => (
        <div className="col-xl-4 col-md-6 col-12" key={card.id}>
          <div className="card">
            <div className="card-body px-4 py-4">
              <div className="row">
                <div className="col-md-4 col-12 d-flex justify-content-start">
                  <div
                    className={`stats-icon purple`}
                    style={{ backgroundColor: `var(--bs-${card.color})` }}
                  >
                    <i className={`bi ${card.icon}`}></i>
                  </div>
                </div>
                <div className="col-md-8 col-12">
                  <h6 className="text-muted fw-semibold">{card.label}</h6>
                  <h6 className="fw-bolder mb-0">
                    {card.format(summary[card.key])}
                  </h6>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
