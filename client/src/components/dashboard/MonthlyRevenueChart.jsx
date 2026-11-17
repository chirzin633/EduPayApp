import Chart from "react-apexcharts";
import { formatMonthLabel, formatRupiah } from "../../utils/format";

export default function MonthlyRevenueChart(props) {
  const { data = [] } = props;

  const categories = data.map((d) => formatMonthLabel(d.month));
  const series = [
    {
      name: "Pendapatan",
      data: data.map((d) => d.total),
    },
  ];

  const options = {
    chart: {
      type: "area",
      height: 320,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    colors: ["#435ebe"],
    dataLabels: { enabled: false },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 },
    },
    xaxis: {
      categories,
      labels: { rotate: -30, style: { fontSize: "11px" } },
    },
    yaxis: {
      labels: {
        formatter: (val) => formatRupiah(val, true),
      },
    },
    tooltip: {
      y: {
        formatter: (val) => formatRupiah(val),
      },
    },
    grid: { borderColor: "#e7eef7" },
  };

  return (
    <div className="card h-100">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="bi bi-graph-up-arrow me-2"></i> Pendapatan 12 Bulan
          Terakhir
        </h5>
      </div>
      <div className="card-body">
        <Chart options={options} series={series} type="area" height={320} />
      </div>
    </div>
  );
}
