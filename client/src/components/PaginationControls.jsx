const PaginationControls = ({ page, totalPages, totalItems, itemLabel = "items", onPageChange }) => {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const canPrev = safePage > 1;
  const canNext = safePage < safeTotalPages;

  return (
    <div className="flex items-center justify-between text-sm text-slate-600 mt-4">
      <div>
        Showing page {safePage} of {safeTotalPages} ({totalItems} {itemLabel})
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={!canPrev}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={!canNext}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
