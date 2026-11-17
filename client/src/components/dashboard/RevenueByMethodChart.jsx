import Chart from "react-apexcharts";
import { PAYMENT_METHOD_LABELS, formatRupiah } from "../../utils/format";

export default function RevenueByMethodChart(props) {
  const { data = [] } = props;

  const categories = data.map(
    (d) => PAYMENT_METHOD_LABELS[d.payment_method] ?? d.payment_method,
  );

  const series = [
    {
      name: "Total",
      data: data.map((d) => d.total),
    },
  ];

  const options = {
    chart: { type: "bar", height: 320, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "45%", borderRadius: 4 },
    },
    colors: ["#435ebe"],
    dataLabels: { enabled: false },
    xaxis: { categories },
    yaxis: {
      labels: { formatter: (val) => formatRupiah(val, true) },
    },
    tooltip: {
      y: { formatter: (val) => formatRupiah(val) },
    },
    grid: { borderColor: "#e7eef7" },
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="bi bi-credit-card me-2"></i> Pendapatan per Metode
        </h5>
      </div>
      <div className="card-body">
        {series[0].data.length ? (
          <Chart options={options} series={series} type="bar" height={320} />
        ) : (
          <p className="text-muted text-center my-5">Belum ada data.</p>
        )}
      </div>
    </div>
  );
}
