import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import PaginationControls from "../components/PaginationControls";
import useAuth from "../hooks/useAuth";

const NotesHistory = () => {
  const { user } = useAuth();
  const [quickNotes, setQuickNotes] = useState([]);
  const [page, setPage] = useState(1);

  const pageSize = 10;
  const totalNotes = quickNotes.length;
  const totalPages = Math.max(1, Math.ceil(totalNotes / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const displayNotes = quickNotes.slice(startIndex, startIndex + pageSize);

  const historyKey = () => {
    const identity = user?.id || user?.email || user?.name || "guest";
    return `som_quick_notes_${identity}_history`;
  };

  const loadHistory = () => {
    const stored = localStorage.getItem(historyKey());
    try {
      setQuickNotes(stored ? JSON.parse(stored) : []);
    } catch {
      setQuickNotes([]);
    }
    setPage(1);
  };

  const deleteNote = (index) => {
    const updated = quickNotes.filter((_, i) => i !== index);
    localStorage.setItem(historyKey(), JSON.stringify(updated));
    setQuickNotes(updated);
    const nextTotalPages = Math.max(1, Math.ceil(updated.length / pageSize));
    setPage((current) => Math.min(current, nextTotalPages));
  };

  useEffect(() => {
    loadHistory();
    if (typeof window !== "undefined") {
      window.addEventListener("quicknotes:saved", loadHistory);
      return () => window.removeEventListener("quicknotes:saved", loadHistory);
    }
  }, [user]);

  return (
    <AppLayout title="Notes History">
      <div className="card-panel p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Quick Notes History</h2>
        {quickNotes.length === 0 ? (
          <p className="text-sm text-slate-500">No quick notes saved yet.</p>
        ) : (
          <div className="space-y-3">
            {displayNotes.map((n, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{n.note}</p>
                  <p className="mt-2 text-xs text-slate-400">{n.savedAt}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteNote(startIndex + i)}
                  className="text-rose-500 hover:text-rose-700 text-xs shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        <PaginationControls
          page={safePage}
          totalPages={totalPages}
          totalItems={totalNotes}
          itemLabel="notes"
          onPageChange={setPage}
        />
      </div>
    </AppLayout>
  );
};

export default NotesHistory;
