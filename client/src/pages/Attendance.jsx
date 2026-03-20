import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import RoleGate from "../components/RoleGate";
import PaginationControls from "../components/PaginationControls";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { emitToast } from "../utils/toast";

const defaultSocketUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5001";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.hostname}:5001`;
};

const socketUrl = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl();

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterSubject, setFilterSubject] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [totalRecordsCount, setTotalRecordsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({
    studentId: "",
    subjectId: "",
    percentage: ""
  });

  const pageSize = 10;
  const load = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setAttendance([]);
        setTotalRecordsCount(0);
        setTotalPages(1);
        setError("You appear to be offline. Turn off Offline mode in DevTools or reconnect, then refresh.");
        return;
      }

      const { data } = await api.get("/attendance", {
        params: {
          page,
          limit: pageSize,
          subjectId: filterSubject || undefined
        }
      });
      if (Array.isArray(data)) {
        setAttendance(data);
        setTotalRecordsCount(data.length);
        setTotalPages(1);
      } else {
        setAttendance(data.items || []);
        setTotalRecordsCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
      setError("");
    } catch (err) {
      setAttendance([]);
      setError(err?.response?.data?.message || "Unable to load attendance");
      setTotalRecordsCount(0);
      setTotalPages(1);
    }
  };

  const loadOptions = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setStudents([]);
        setSubjects([]);
        return;
      }

      const requests = [api.get("/subjects")];
      if (user?.role !== "Student") {
        requests.unshift(api.get("/students"));
      }

      const responses = await Promise.all(requests);
      const subjectsRes = responses[responses.length - 1];
      const studentsRes = user?.role !== "Student" ? responses[0] : null;

      setStudents(studentsRes?.data || []);
      const filteredSubjects = user?.role === "Faculty"
        ? subjectsRes.data.filter((s) => s.facultyId?._id === user.id)
        : subjectsRes.data;
      setSubjects(filteredSubjects);
    } catch {
      setStudents([]);
      setSubjects([]);
    }
  };

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    load();
    loadOptions();
  }, [user?.role, page, filterSubject]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = io(socketUrl, {
      autoConnect: typeof navigator === "undefined" || navigator.onLine !== false
    });

    const onUpdated = () => loadRef.current();

    const onOnline = () => {
      if (socket.disconnected) socket.connect();
      loadRef.current();
    };

    const onOffline = () => socket.disconnect();

    socket.on("attendance:created", onUpdated);
    socket.on("attendance:updated", onUpdated);
    socket.on("attendance:deleted", onUpdated);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      socket.off("attendance:created", onUpdated);
      socket.off("attendance:updated", onUpdated);
      socket.off("attendance:deleted", onUpdated);
      socket.disconnect();
    };
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const saveAttendance = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, percentage: Number(form.percentage) };
      if (editingId) {
        await api.put(`/attendance/${editingId}`, payload);
        emitToast({ type: "success", title: "Updated", message: "Attendance updated successfully." });
      } else {
        await api.post("/attendance", payload);
        emitToast({ type: "success", title: "Added", message: "Attendance saved successfully." });
      }
      setEditingId(null);
      setForm({ studentId: "", subjectId: "", percentage: "" });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save attendance");
    }
  };

  const startEdit = (record) => {
    setEditingId(record._id);
    setForm({
      studentId: record.studentId?._id || "",
      subjectId: record.subjectId?._id || "",
      percentage: String(record.percentage ?? "")
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ studentId: "", subjectId: "", percentage: "" });
    setError("");
  };

  const deleteAttendance = async (id) => {
    if (!window.confirm("Delete this attendance record? This action cannot be undone.")) return;
    try {
      await api.delete(`/attendance/${id}`);
      emitToast({ type: "success", title: "Deleted", message: "Attendance record deleted." });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete attendance record");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} attendance record(s)? This action cannot be undone.`)) return;
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/attendance/${id}`)));
      emitToast({ type: "success", title: "Deleted", message: "Selected attendance records deleted." });
      setSelectedIds(new Set());
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete selected attendance records");
    }
  };

  const sortedAttendance = [...attendance]
    .filter(a => !filterSubject || a.subjectId?._id === filterSubject)
    .sort((a, b) => (a.studentId?.name || "").localeCompare(b.studentId?.name || ""))
    .map((a) => a);

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [filterSubject]);

  const safePage = Math.min(page, totalPages);
  const displayAttendance = showAll ? sortedAttendance : sortedAttendance.slice(0, 5);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(displayAttendance.map((a) => a._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = displayAttendance.length > 0 && displayAttendance.every((a) => selectedIds.has(a._id));

  const totalRecords = totalRecordsCount;
  const lowAttendanceRecords = sortedAttendance.filter((a) => Number(a.percentage) < 80);
  const lowAttendanceCount = lowAttendanceRecords.length;
  const lowAttendanceNames = Array.from(
    new Set(lowAttendanceRecords.map((a) => a.studentId?.name || "Student"))
  );
  const lowestAttendance = sortedAttendance.reduce((worst, a) => {
    if (!worst) return a;
    return Number(a.percentage) < Number(worst.percentage) ? a : worst;
  }, null);

  return (
    <AppLayout title="Attendance">
      <RoleGate roles={["Admin", "Faculty"]}>
        <form className="card-panel p-6 grid md:grid-cols-3 gap-4" onSubmit={saveAttendance}>
          {error && <p className="md:col-span-3 text-rose-600 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium mb-1">Student Name</label>
            <select name="studentId" value={form.studentId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Student Name</option>
              {[...students]
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                .map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject Name</label>
            <select name="subjectId" value={form.subjectId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Subject Name</option>
              {[...subjects]
                .sort((a, b) => (a.subjectName || "").localeCompare(b.subjectName || ""))
                .map(s => <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectId})</option>)}
            </select>
          </div>
          <FormInput label="Percentage" name="percentage" type="number" min="0" max="100" value={form.percentage} onChange={handleChange} required />
          <div className="md:col-span-3 flex gap-3">
            <button className="flex-1 px-4 py-2 rounded-lg bg-ink text-white">
              {editingId ? "Update Attendance" : "Record Attendance"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </RoleGate>

      <div className="mt-6">
        {error && (
          <div className="card-panel p-4 mb-4 text-sm text-rose-600">{error}</div>
        )}
        <div className="card-panel p-4 mb-4">
          <label className="block text-sm font-medium mb-1">Filter by Subject</label>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
          </select>
        </div>
        <RoleGate roles={["Admin", "Faculty"]}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-slate-600">
              Selected: {selectedIds.size}
            </div>
            <button
              onClick={deleteSelected}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 rounded-lg text-sm bg-rose-600 text-white disabled:opacity-50 hover:bg-rose-700"
            >
              Delete Selected
            </button>
          </div>
        </RoleGate>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Records</p>
            <p className="text-2xl font-semibold text-ink">{totalRecords}</p>
          </div>
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Below 80%</p>
            <p className="text-2xl font-semibold text-rose-700">{lowAttendanceCount}</p>
            {lowAttendanceNames.length > 0 ? (
              <p className="text-xs text-slate-600 mt-1">
                {lowAttendanceNames.join(", ")}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Why it matters: low attendance risks outcomes.</p>
            )}
          </div>
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Lowest Attendance</p>
            <p className="text-2xl font-semibold text-amber-700">
              {lowestAttendance ? `${lowestAttendance.percentage}%` : "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {lowestAttendance ? `${lowestAttendance.studentId?.name || "Student"} in ${lowestAttendance.subjectId?.subjectName || "Subject"}` : "No data yet."}
            </p>
          </div>
        </div>
        <div className="card-panel overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <RoleGate roles={["Admin", "Faculty"]}>
                  <th scope="col" className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <label className="inline-flex items-center gap-1 whitespace-nowrap">
                      <input
                        type="checkbox"
                        aria-label="Select all attendance records in view"
                        checked={allSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                      <span className="text-[11px] tracking-wide">Select</span>
                    </label>
                  </th>
                </RoleGate>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                <RoleGate roles={["Admin", "Faculty"]}>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </RoleGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayAttendance.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="w-12 px-3 py-4 text-sm">
                      <input
                        type="checkbox"
                        aria-label={`Select ${a.studentId?.name || "student"} attendance`}
                        checked={selectedIds.has(a._id)}
                        onChange={() => toggleRow(a._id)}
                      />
                    </td>
                  </RoleGate>
                  <td className="px-6 py-4 text-sm">{a.studentId?.name || "Student Name"}</td>
                  <td className="px-6 py-4 text-sm">{a.subjectId?.subjectName || "Subject Name"}</td>
                  <td className="px-6 py-4 text-sm">{a.percentage}%</td>
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                        <button
                          onClick={() => startEdit(a)}
                          className="px-3 py-1.5 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAttendance(a._id)}
                          className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                        >
                          Delete
                        </button>
                    </td>
                  </RoleGate>
                </tr>
              ))}
              {sortedAttendance.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-600" colSpan={user?.role === "Student" ? 3 : 5}>
                    No attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sortedAttendance.length > 5 && (
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
          totalItems={totalRecordsCount}
          itemLabel="records"
          onPageChange={setPage}
        />
      </div>
    </AppLayout>
  );
};

export default Attendance;

