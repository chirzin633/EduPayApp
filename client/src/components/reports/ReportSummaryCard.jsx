export default function ReportSummaryCard(props) {
  const { title, items } = props;

  return (
    <div className="card bg-light-primary mb-3">
      <div className="card-body py-3">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h6 className="mb-0 fw-bold">{title}</h6>
          <div className="d-flex gap-4 flex-wrap">
            {items.map((item, idx) => (
              <div key={idx}>
                <small className="text-muted d-block">{item.label}</small>
                <strong className={item.className || ""}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
