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

const Marks = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filterSubject, setFilterSubject] = useState("");
  const [editingId, setEditingId] = useState("");
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [totalMarksCount, setTotalMarksCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({
    studentId: "",
    subjectId: "",
    testName: "",
    marks: ""
  });

  const pageSize = 10;
  const load = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setMarks([]);
        setTotalMarksCount(0);
        setTotalPages(1);
        setError("You appear to be offline. Turn off Offline mode in DevTools or reconnect, then refresh.");
        return;
      }

      const { data } = await api.get("/marks", {
        params: {
          page,
          limit: pageSize,
          subjectId: filterSubject || undefined
        }
      });
      if (Array.isArray(data)) {
        setMarks(data);
        setTotalMarksCount(data.length);
        setTotalPages(1);
      } else {
        setMarks(data.items || []);
        setTotalMarksCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
      setError("");
    } catch (err) {
      setMarks([]);
      setError(err?.response?.data?.message || "Unable to load marks");
      setTotalMarksCount(0);
      setTotalPages(1);
    }
  };

  const loadStudents = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setStudents([]);
        return;
      }
      const { data } = await api.get("/students");
      setStudents(data);
    } catch {
      setStudents([]);
    }
  };

  const loadSubjects = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setSubjects([]);
        return;
      }
      const { data } = await api.get("/subjects");
      const filteredSubjects = user?.role === "Faculty"
        ? data.filter((s) => s.facultyId?._id === user.id)
        : data;
      setSubjects(filteredSubjects);
    } catch {
      setSubjects([]);
    }
  };

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    load();
    if (user?.role !== "Student") {
      loadStudents();
    }
    loadSubjects();
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

    socket.on("marks:created", onUpdated);
    socket.on("marks:updated", onUpdated);
    socket.on("marks:deleted", onUpdated);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      socket.off("marks:created", onUpdated);
      socket.off("marks:updated", onUpdated);
      socket.off("marks:deleted", onUpdated);
      socket.disconnect();
    };
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ studentId: "", subjectId: "", testName: "", marks: "" });
    setEditingId("");
  };

  const addOrUpdateMark = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, marks: Number(form.marks) };
      if (editingId) {
        await api.put(`/marks/${editingId}`, payload);
        emitToast({ type: "success", title: "Updated", message: "Marks updated successfully." });
      } else {
        await api.post("/marks", payload);
        emitToast({ type: "success", title: "Added", message: "Marks added successfully." });
      }
      resetForm();
      load();
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || (editingId ? "Failed to update marks" : "Failed to add marks"));
    }
  };

  const startEdit = (mark) => {
    setEditingId(mark._id);
    setForm({
      studentId: mark.studentId?._id || "",
      subjectId: mark.subjectId?._id || "",
      testName: mark.testName || "",
      marks: String(mark.marks ?? "")
    });
    setError("");
  };

  const deleteMark = async (id) => {
    if (!window.confirm("Delete this mark entry? This action cannot be undone.")) return;
    try {
      await api.delete(`/marks/${id}`);
      emitToast({ type: "success", title: "Deleted", message: "Mark entry deleted." });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete mark entry");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} mark(s)? This action cannot be undone.`)) return;
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/marks/${id}`)));
      emitToast({ type: "success", title: "Deleted", message: "Selected marks deleted." });
      setSelectedIds(new Set());
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete selected marks");
    }
  };

  const sortedMarks = marks
    .filter(m => !filterSubject || m.subjectId?._id === filterSubject)
    .sort((a, b) => (a.studentId?.name || "").localeCompare(b.studentId?.name || ""))
    .map((m) => m);

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [filterSubject]);

  const safePage = Math.min(page, totalPages);
  const displayMarks = showAll ? sortedMarks : sortedMarks.slice(0, 5);

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
      setSelectedIds(new Set(displayMarks.map((m) => m._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = displayMarks.length > 0 && displayMarks.every((m) => selectedIds.has(m._id));
  const normalizedTest = (value = "") => value.toLowerCase().replace(/\s+/g, "");
  const normalizeLabel = (name = "") => {
    const trimmed = name.trim();
    if (!trimmed) return "Test";
    const normalized = normalizedTest(trimmed);
    if (normalized === "internal1") return "Internal 1";
    if (normalized === "internal2") return "Internal 2";
    return trimmed;
  };
  const testGroupsMap = new Map([
    ["internal1", { key: "internal1", label: "Internal 1", rows: [] }],
    ["internal2", { key: "internal2", label: "Internal 2", rows: [] }]
  ]);
  sortedMarks.forEach((m) => {
    const groupKey = normalizedTest(m.testName) || "test";
    if (!testGroupsMap.has(groupKey)) {
      testGroupsMap.set(groupKey, { key: groupKey, label: normalizeLabel(m.testName), rows: [] });
    }
    testGroupsMap.get(groupKey).rows.push(m);
  });
  const testGroups = [...testGroupsMap.values()].filter(
    (group) => group.rows.length > 0 || group.key === "internal1" || group.key === "internal2"
  );
  const getMarkMeta = (score) => {
    const marksValue = Number(score || 0);
    if (marksValue >= 75) return { label: "Excellent", tone: "text-emerald-700 bg-emerald-100" };
    if (marksValue >= 50) return { label: "Pass", tone: "text-sky-700 bg-sky-100" };
    return { label: "Needs Improvement", tone: "text-rose-700 bg-rose-100" };
  };
  const totalMarks = totalMarksCount;
  const lowMarksRecords = sortedMarks.filter((m) => Number(m.marks) < 50);
  const lowMarksCount = lowMarksRecords.length;
  const lowMarksNames = Array.from(
    new Set(lowMarksRecords.map((m) => m.studentId?.name || "Student"))
  );
  const topScore = sortedMarks.reduce((best, m) => {
    if (!best) return m;
    return Number(m.marks) > Number(best.marks) ? m : best;
  }, null);
  const topScoreValue = topScore ? Number(topScore.marks) : null;
  const topScoreRecords = topScoreValue === null
    ? []
    : sortedMarks.filter((m) => Number(m.marks) === topScoreValue);
  const topScoreNames = Array.from(
    new Set(topScoreRecords.map((m) => m.studentId?.name || "Student"))
  );
  const topScoreSubject = topScoreRecords[0]?.subjectId?.subjectName || "Subject";
  const topThree = [...sortedMarks]
    .sort((a, b) => Number(b.marks) - Number(a.marks))
    .slice(0, 3);

  return (
    <AppLayout title="Marks">
      <RoleGate roles={["Admin", "Faculty"]}>
        <form className="card-panel p-6 grid md:grid-cols-4 gap-4" onSubmit={addOrUpdateMark}>
          <div>
            <label className="block text-sm font-medium mb-1">Student Name</label>
            <select name="studentId" value={form.studentId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Student Name</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.studentId})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject Name</label>
            <select name="subjectId" value={form.subjectId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Subject Name</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName} ({s.subjectId})</option>)}
            </select>
          </div>
          <FormInput label="Test Name" name="testName" value={form.testName} onChange={handleChange} required />
          <FormInput label="Marks" name="marks" type="number" min="0" max="100" value={form.marks} onChange={handleChange} required />
          <div className="md:col-span-4 flex gap-3">
            <button className="flex-1 px-4 py-2 rounded-lg bg-ink text-white">
              {editingId ? "Update Marks" : "Add Marks"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
              >
                Cancel
              </button>
            )}
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
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Marks</p>
            <p className="text-2xl font-semibold text-ink">{totalMarks}</p>
          </div>
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Below 50</p>
            <p className="text-2xl font-semibold text-rose-700">{lowMarksCount}</p>
            {lowMarksNames.length > 0 ? (
              <p className="text-xs text-slate-600 mt-1">
                {lowMarksNames.join(", ")}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Why it matters: identify students needing support.</p>
            )}
          </div>
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Top Score</p>
            <p className="text-2xl font-semibold text-emerald-700">
              {topScore ? `${topScore.marks}/100` : "N/A"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {topScore ? `${topScoreNames.join(", ")} in ${topScoreSubject}` : "No data yet."}
            </p>
            {topThree.length > 0 ? (
              <p className="text-xs text-slate-600 mt-2">
                Top 3: {topThree.map((m) => `${m.studentId?.name || "Student"} (${m.marks})`).join(", ")}
              </p>
            ) : null}
          </div>
        </div>
        {user?.role === "Student" ? (
          <div className="grid md:grid-cols-2 gap-6">
            {testGroups.map((group) => (
              <div key={group.key} className="card-panel overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 text-sm font-semibold text-slate-700">{group.label}</div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {group.rows.map((m) => (
                      <tr key={m._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{m.subjectId?.subjectName || "Subject Name"}</td>
                        <td className="px-6 py-4 text-sm">{m.marks}</td>
                      </tr>
                    ))}
                    {group.rows.length === 0 && (
                      <tr>
                        <td className="px-6 py-6 text-sm text-slate-600" colSpan={2}>No {group.label} marks.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="md:hidden space-y-3">
              {displayMarks.map((m) => (
                <div key={m._id} className="card-panel p-4">
                  {(() => {
                    const markMeta = getMarkMeta(m.marks);
                    return (
                  <div className="flex items-start justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(m._id)}
                        onChange={() => toggleRow(m._id)}
                      />
                      Select
                    </label>
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Marks</p>
                      <p className="text-lg font-bold text-slate-900 leading-tight">{m.marks}/100</p>
                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${markMeta.tone}`}>
                        {markMeta.label}
                      </span>
                    </div>
                  </div>
                    );
                  })()}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-slate-500">Student ID:</span> {m.studentId?.studentId || "N/A"}</p>
                    <p><span className="text-slate-500">Student:</span> {m.studentId?.name || "Student"}</p>
                    <p><span className="text-slate-500">Subject:</span> {m.subjectId?.subjectName || "Subject"}</p>
                    <p><span className="text-slate-500">Test:</span> {m.testName}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => startEdit(m)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteMark(m._id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {sortedMarks.length === 0 && (
                <div className="card-panel p-4 text-sm text-slate-600">No marks found.</div>
              )}
            </div>

            <div className="hidden md:block card-panel overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead className="bg-gray-50">
                  <tr>
                    <RoleGate roles={["Admin", "Faculty"]}>
                      <th scope="col" className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        <label className="inline-flex items-center gap-1 whitespace-nowrap">
                          <input
                            type="checkbox"
                            aria-label="Select all marks in view"
                            checked={allSelected}
                            onChange={(e) => toggleAll(e.target.checked)}
                          />
                          <span className="text-[11px] tracking-wide">Select</span>
                        </label>
                      </th>
                    </RoleGate>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                    <RoleGate roles={["Admin", "Faculty"]}>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </RoleGate>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayMarks.map((m) => (
                    <tr key={m._id} className="hover:bg-gray-50">
                      <RoleGate roles={["Admin", "Faculty"]}>
                        <td className="w-12 px-3 py-4 text-sm">
                          <input
                            type="checkbox"
                            aria-label={`Select ${m.studentId?.name || "student"} ${m.testName}`}
                            checked={selectedIds.has(m._id)}
                            onChange={() => toggleRow(m._id)}
                          />
                        </td>
                      </RoleGate>
                      <td className="px-6 py-4 text-sm">{m.studentId?.studentId || "N/A"}</td>
                      <td className="px-6 py-4 text-sm">{m.studentId?.name || "Student Name"}</td>
                      <td className="px-6 py-4 text-sm">{m.subjectId?.subjectName || "Subject Name"}</td>
                      <td className="px-6 py-4 text-sm">{m.testName}</td>
                      <td className="px-6 py-4 text-sm">{m.marks}</td>
                      <RoleGate roles={["Admin", "Faculty"]}>
                        <td className="px-6 py-4 text-sm flex items-center gap-2">
                          <button
                            onClick={() => startEdit(m)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteMark(m._id)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                          >
                            Delete
                          </button>
                        </td>
                      </RoleGate>
                    </tr>
                  ))}
                  {sortedMarks.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-slate-600" colSpan={7}>
                        No marks found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {sortedMarks.length > 5 && (
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
              totalItems={totalMarksCount}
              itemLabel="marks"
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Marks;

