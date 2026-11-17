import Chart from "react-apexcharts";
import { INVOICE_STATUS_LABELS } from "../../utils/format";

const STATUS_COLORS = {
  unpaid: "#6c757d",
  partially_paid: "#ffc107",
  paid: "#198754",
};

export default function StatusDistributionChart(props) {
  const { data = [] } = props;
  const labels = data.map((d) => INVOICE_STATUS_LABELS[d.status] ?? d.status);
  const series = data.map((d) => d.count);
  const colors = data.map((d) => STATUS_COLORS[d.status] ?? "#435ebe");

  const options = {
    chart: { type: "donut", fontFamily: "inherit" },
    labels,
    colors,
    legend: { position: "bottom" },
    dataLabels: { enabled: true },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: { show: true, label: "Total Invoice" },
          },
        },
      },
    },
    tooltip: {
      y: { formatter: (val) => `${val} invoice` },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="bi bi-pie-chart me-2"></i> Distribusi Status Invoice
        </h5>
      </div>
      <div className="card-body">
        {series.length ? (
          <Chart options={options} series={series} type="donut" height={320} />
        ) : (
          <p className="text-muted text-center my-5">Belum ada data.</p>
        )}
      </div>
    </div>
  );
}
