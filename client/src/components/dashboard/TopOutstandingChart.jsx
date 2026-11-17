import Chart from "react-apexcharts";
import { formatRupiah } from "../../utils/format";

export default function TopOutstandingChart(props) {
  const { data = [] } = props;

  const categories = data.map((d) => d.class_name);
  const series = [
    {
      name: "Tunggakan",
      data: data.map((d) => d.total_outstanding),
    },
  ];

  const options = {
    chart: { type: "bar", height: 320, toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 4, barHeight: "60%" },
    },
    colors: ["#dc3545"],
    dataLabels: {
      enabled: true,
      formatter: (val) => formatRupiah(val, true),
      offsetX: 10,
      style: { fontSize: "11px" },
    },
    xaxis: {
      categories,
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
          <i className="bi bi-bar-chart me-2"></i> Top 5 Kelas dengan Tunggakan
        </h5>
      </div>
      <div className="card-body">
        {series[0].data.length ? (
          <Chart options={options} series={series} type="bar" height={320} />
        ) : (
          <p className="text-muted text-center my-5">Tidak ada tunggakan.</p>
        )}
      </div>
    </div>
  );
}
