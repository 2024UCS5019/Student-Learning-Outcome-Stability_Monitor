import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import RoleGate from "../components/RoleGate";
import PaginationControls from "../components/PaginationControls";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { emitToast } from "../utils/toast";
import Modal from "../components/Modal";

const NoteHistory = () => {
  const { user } = useAuth();
  const canManageNotes = ["Admin", "Faculty"].includes(user?.role);
  const [notes, setNotes] = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [totalNotesCount, setTotalNotesCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({
    targetType: "Student",
    targetId: "",
    subjectId: "",
    note: "",
    status: "Average"
  });

  const getStatusStyle = (status) => {
    const value = status || "Average";
    if (value === "Great") return "bg-emerald-100 text-emerald-700";
    if (value === "Poor") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  const currentTargets = useMemo(
    () => (form.targetType === "Student" ? students : staff),
    [form.targetType, students, staff]
  );

  const pageSize = 10;
  const load = async () => {
    try {
      const { data } = await api.get("/note-history", {
        params: {
          targetType: filterType || undefined,
          page,
          limit: pageSize
        }
      });
      if (Array.isArray(data)) {
        setNotes(data);
        setTotalNotesCount(data.length);
        setTotalPages(1);
      } else {
        setNotes(data.items || []);
        setTotalNotesCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
      setError("");
    } catch (err) {
      setNotes([]);
      setError(err?.response?.data?.message || "Unable to load notes");
      setTotalNotesCount(0);
      setTotalPages(1);
    }
  };

  const loadTargets = async () => {
    try {
      const { data } = await api.get("/note-history/targets");
      setStudents(data.students || []);
      setStaff(data.staff || []);
    } catch {
      setStudents([]);
      setStaff([]);
    }
  };

  const loadSubjects = async () => {
    try {
      const { data } = await api.get("/subjects");
      const filtered = user?.role === "Faculty"
        ? data.filter((s) => s.facultyId?._id === user.id)
        : data;
      setSubjects(filtered);
    } catch {
      setSubjects([]);
    }
  };

  useEffect(() => {
    load();
  }, [filterType, page]);

  useEffect(() => {
    if (canManageNotes) {
      loadTargets();
      loadSubjects();
    } else {
      setStudents([]);
      setStaff([]);
      setSubjects([]);
    }
  }, [canManageNotes]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, targetId: "", subjectId: "" }));
  }, [form.targetType]);

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [filterType]);

  const safePage = Math.min(page, totalPages);
  const displayNotes = showAll ? notes : notes.slice(0, 5);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const greatCount = notes.filter((n) => (n.status || "Average") === "Great").length;
  const averageCount = notes.filter((n) => (n.status || "Average") === "Average").length;
  const poorCount = notes.filter((n) => (n.status || "Average") === "Poor").length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingId) {
        await api.put(`/note-history/${editingId}`, form);
        emitToast({ type: "success", title: "Updated", message: "Feedback updated successfully." });
      } else {
        await api.post("/note-history", form);
        emitToast({ type: "success", title: "Added", message: "Feedback saved successfully." });
      }
      setForm((prev) => ({
        ...prev,
        note: "",
        targetId: "",
        subjectId: "",
        status: "Average"
      }));
      setEditingId("");
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save note");
    }
  };

  const startEdit = (note) => {
    setEditingId(note._id);
    setForm({
      targetType: note.targetType || "Student",
      targetId: note.targetId || "",
      subjectId: note.subjectId || "",
      note: note.note || "",
      status: note.status || "Average"
    });
  };

  const cancelEdit = () => {
    setEditingId("");
    setForm({
      targetType: "Student",
      targetId: "",
      subjectId: "",
      note: "",
      status: "Average"
    });
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note? This action cannot be undone.")) return;
    setError("");
    try {
      await api.delete(`/note-history/${id}`);
      emitToast({ type: "success", title: "Deleted", message: "Feedback deleted." });
      if (editingId === id) cancelEdit();
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete note");
    }
  };

  const renderFeedbackForm = (wrapperClassName) => (
    <form className={wrapperClassName} onSubmit={handleSubmit}>
      {error ? <p className="sm:col-span-2 md:col-span-3 text-sm text-rose-600">{error}</p> : null}

      <label className="text-sm">
        <span className="block mb-1 font-medium">Target Type</span>
        <select
          value={form.targetType}
          onChange={(e) => setForm({ ...form, targetType: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="Student">Student</option>
          <option value="Staff">Staff</option>
        </select>
      </label>

      <label className="text-sm">
        <span className="block mb-1 font-medium">
          {form.targetType === "Student" ? "Student" : "Staff"}
        </span>
        <select
          value={form.targetId}
          onChange={(e) => setForm({ ...form, targetId: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        >
          <option value="">Select</option>
          {currentTargets.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name} {item.email ? `(${item.email})` : ""}
            </option>
          ))}
        </select>
      </label>

      {form.targetType === "Student" ? (
        <label className="text-sm">
          <span className="block mb-1 font-medium">Subject</span>
          <select
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          >
            <option value="">Select</option>
            {subjects.map((item) => (
              <option key={item._id} value={item._id}>
                {item.subjectName} ({item.subjectId})
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="text-sm">
        <span className="block mb-1 font-medium">Status</span>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        >
          <option value="Great">Great</option>
          <option value="Average">Average</option>
          <option value="Poor">Poor</option>
        </select>
      </label>

      <label className="text-sm sm:col-span-2 md:col-span-3">
        <span className="block mb-1 font-medium">Note</span>
        <textarea
          rows={4}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Write student/staff note..."
          required
        />
      </label>

      <div className="sm:col-span-2 md:col-span-3 flex flex-col sm:flex-row gap-3">
        <button className="flex-1 px-4 py-2 rounded-lg bg-ink text-white">
          {editingId ? "Update Note" : "Send Feedback"}
        </button>
        {editingId ? (
          <button
            type="button"
            onClick={cancelEdit}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 sm:flex-none"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );

  return (
    <AppLayout title="Feedback">
      <RoleGate roles={["Admin", "Faculty"]}>
        {editingId ? (
          <Modal open={Boolean(editingId)} title="Edit Feedback" onClose={cancelEdit}>
            {renderFeedbackForm("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4")}
          </Modal>
        ) : (
          <div className="mb-6">
            {renderFeedbackForm("card-panel p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4")}
          </div>
        )}
      </RoleGate>

      <div className="card-panel p-4">
        <label className="text-sm">
          <span className="block mb-1 font-medium">Filter by Type</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="">All</option>
            <option value="Student">Student</option>
            {canManageNotes ? <option value="Staff">Staff</option> : null}
          </select>
        </label>
      </div>

      <div className="card-panel p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
          <span className="text-xs text-slate-500">Latest 5 updates</span>
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-slate-600">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {notes.slice(0, 5).map((n) => (
              <div key={n._id} className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-300" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-slate-800">{n.targetName}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusStyle(n.status)}`}>
                      {n.status || "Average"}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600">{n.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-4">
        <div className="card-panel p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Great</p>
          <p className="text-2xl font-semibold text-emerald-700">{greatCount}</p>
          <p className="text-xs text-slate-500 mt-1">Why it matters: highlight strong outcomes.</p>
        </div>
        <div className="card-panel p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average</p>
          <p className="text-2xl font-semibold text-amber-700">{averageCount}</p>
        </div>
        <div className="card-panel p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Poor</p>
          <p className="text-2xl font-semibold text-rose-700">{poorCount}</p>
        </div>
      </div>

      <div className="card-panel overflow-hidden mt-4">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Date</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Student Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Subject</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Note</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created By</th>
              {canManageNotes ? (
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayNotes.map((n) => (
              <tr key={n._id}>
                <td className="px-4 py-3 text-sm">{new Date(n.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">{n.targetType}</td>
                <td className="px-4 py-3 text-sm">{n.targetName}</td>
                <td className="px-4 py-3 text-sm">{n.subjectName || "—"}</td>
                <td className="px-4 py-3 text-sm">{n.note}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusStyle(n.status)}`}>
                    {n.status || "Average"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{n.createdBy?.name || "User"}</td>
                {canManageNotes ? (
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(n)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(n._id)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
            {notes.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-600" colSpan={canManageNotes ? 8 : 7}>
                  No notes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {notes.length > 5 && (
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 text-slate-700"
          >
            {showAll ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
      <PaginationControls
        page={safePage}
        totalPages={totalPages}
        totalItems={totalNotesCount}
        itemLabel="notes"
        onPageChange={setPage}
      />
    </AppLayout>
  );
};

export default NoteHistory;
