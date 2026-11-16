export default function ReportPagination(props) {
  const { meta, onPageChange } = props;

  if (!meta || meta.last_page <= 1) {
    return null;
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
      <small className="text-muted">
        Menampilkan halaman {meta.current_page} dari {meta.last_page} — total{" "}
        <strong>{meta.total}</strong>
      </small>
      <div>
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={meta.current_page === 1}
          onClick={() => onPageChange(meta.current_page - 1)}
        >
          Previous
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={meta.current_page === meta.last_page}
          onClick={() => onPageChange(meta.current_page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
