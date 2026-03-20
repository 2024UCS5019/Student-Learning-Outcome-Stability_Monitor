import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const MAX_NOTES_LENGTH = 1000;

const QuickNotesWidget = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedAt, setSavedAt] = useState("");

  const storageKey = useMemo(() => {
    const identity = user?.id || user?.email || user?.name || "guest";
    return `som_quick_notes_${identity}`;
  }, [user?.id, user?.email, user?.name]);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotes(parsed.notes || "");
        setSavedAt(parsed.savedAt || "");
      } catch {
        setNotes(stored);
        setSavedAt("");
      }
    } else {
      setNotes("");
      setSavedAt("");
    }
  }, [storageKey]);

  const saveNotes = async () => {
    if (!notes.trim()) return;

    try {
      const { data: targets } = await api.get("/note-history/targets");
      
      if (targets.staff && targets.staff.length > 0) {
        const targetId = user?.id || targets.staff[0]?._id;
        const targetType = "Staff";

        await api.post("/note-history", {
          targetType,
          targetId,
          note: notes,
          status: "Average"
        });
      }
    } catch (error) {
      console.error("Failed to save note to history:", error);
    }

    const snapshot = {
      notes,
      savedAt: new Date().toLocaleString()
    };
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
    setSavedAt(snapshot.savedAt);
  };

  const clearNotes = () => {
    setNotes("");
    setSavedAt("");
    localStorage.removeItem(storageKey);
  };

  return (
    <div className="fixed bottom-5 left-5 z-50">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-gray-900"
        >
          Quick Notes
        </button>
      ) : (
        <div className="w-[320px] rounded-2xl border border-slate-300 bg-white p-4 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Quick Notes</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
            placeholder="Write temporary notes here..."
            rows={7}
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-black"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{notes.length}/{MAX_NOTES_LENGTH}</span>
            <span>{savedAt ? `Saved: ${savedAt}` : "Not saved yet"}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveNotes}
              className="flex-1 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-gray-900"
            >
              Save
            </button>
            <button
              type="button"
              onClick={clearNotes}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickNotesWidget;
