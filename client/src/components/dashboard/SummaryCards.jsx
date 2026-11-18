import { formatRupiah } from "../../utils/format";

const CARDS = [
  {
    key: "total_students",
    label: "Total Siswa Aktif",
    icon: "iconly-boldUser1",
    color: "purple",
    format: (v) => v ?? 0,
  },

  {
    key: "total_revenue",
    label: "Total Pendapatan",
    icon: "iconly-boldWallet",
    color: "green",
    format: (v) => formatRupiah(v),
  },

  {
    key: "total_outstanding",
    label: "Total Tunggakan",
    icon: "iconly-boldDanger",
    color: "red",
    format: (v) => formatRupiah(v),
  },

  {
    key: "unpaid_invoices",
    label: "Invoices Belum Dibayar",
    icon: "iconly-boldPaper-Fail",
    color: "gray",
    format: (v) => v ?? 0,
  },

  {
    key: "partially_paid_invoices",
    label: "Invoice Sebagian",
    icon: "iconly-boldTime-Circle",
    color: "yellow",
    format: (v) => v ?? 0,
  },

  {
    key: "paid_invoices",
    label: "Invoice Lunas",
    icon: "iconly-boldShield-Done",
    color: "blue",
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
        <div className="col-xl-4 col-md-6 col-12" key={card.key}>
          <div className="card h-100">
            <div className="card-body px-4 py-2 py-xl-4 d-flex align-items-center">
              <div className={`stats-icon ${card.color} me-3 flex-shrink-0`}>
                <i className={card.icon}></i>
              </div>

              <div className="min-w-0">
                <h6 className="text-muted fw-semibold mb-1">{card.label}</h6>
                <h6 className="fw-bolder mb-0">
                  {card.format(summary[card.key])}
                </h6>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
