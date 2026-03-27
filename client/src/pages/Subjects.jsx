import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import RoleGate from "../components/RoleGate";
import PaginationControls from "../components/PaginationControls";
import useAuth from "../hooks/useAuth";
import useDebouncedValue from "../hooks/useDebouncedValue";
import api from "../services/api";
import { emitToast } from "../utils/toast";

const defaultSocketUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5001";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.hostname}:5001`;
};

const socketUrl = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl();

const Subjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [showFacultyPassword, setShowFacultyPassword] = useState(false);
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);
  const [form, setForm] = useState({
    subjectId: "",
    subjectName: "",
    facultyCode: "",
    facultyName: "",
    facultyEmail: "",
    facultyPassword: ""
  });

  const pageSize = 10;
  const load = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setSubjects([]);
      setTotalSubjects(0);
      setTotalPages(1);
      setPageError("You appear to be offline. Turn off Offline mode in DevTools or reconnect, then refresh.");
      return;
    }

    try {
      const { data } = await api.get("/subjects", {
        params: {
          page,
          limit: pageSize,
          search: debouncedSearch.trim() || undefined
        }
      });
      if (Array.isArray(data)) {
        setSubjects(data);
        setTotalSubjects(data.length);
        setTotalPages(1);
      } else {
        setSubjects(data.items || []);
        setTotalSubjects(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
      setPageError("");
    } catch (err) {
      setSubjects([]);
      setTotalSubjects(0);
      setTotalPages(1);
      setPageError(err?.response?.data?.message || "Unable to load subjects. Ensure the backend is running on port 5001.");
    }
  }, [page, debouncedSearch]);

  const resetForm = () => {
    setForm({
      subjectId: "",
      subjectName: "",
      facultyCode: "",
      facultyName: "",
      facultyEmail: "",
      facultyPassword: ""
    });
    setEditingId("");
    setShowFacultyPassword(false);
  };

  useEffect(() => {
    load();
  }, [user?.role, load]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socket = io(socketUrl, {
      autoConnect: typeof navigator === "undefined" || navigator.onLine !== false
    });

    const onUpdated = () => loadRef.current();
    socket.on("subjects:updated", onUpdated);

    const onOnline = () => {
      if (socket.disconnected) socket.connect();
      loadRef.current();
    };

    const onOffline = () => {
      socket.disconnect();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      socket.off("subjects:updated", onUpdated);
      socket.disconnect();
    };
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addOrUpdateSubject = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const payload = {
        subjectId: form.subjectId,
        subjectName: form.subjectName
      };

      if (user?.role === "Admin") {
        payload.faculty = {
          facultyId: form.facultyCode,
          name: form.facultyName,
          email: form.facultyEmail,
          password: form.facultyPassword
        };
      }

      if (editingId) {
        await api.put(`/subjects/${editingId}`, payload);
        emitToast({ type: "success", title: "Updated", message: "Subject updated successfully." });
      } else {
        await api.post("/subjects", payload);
        emitToast({ type: "success", title: "Added", message: "Subject added successfully." });
      }

      resetForm();
      load();
    } catch (err) {
      setFormError(err?.response?.data?.message || (editingId ? "Failed to update subject" : "Failed to add subject"));
    }
  };

  const startEdit = (subject) => {
    setFormError("");
    setEditingId(subject._id);
    setForm({
      subjectId: subject.subjectId || "",
      subjectName: subject.subjectName || "",
      facultyCode: subject.facultyId?.facultyCode || "",
      facultyName: subject.facultyId?.name || "",
      facultyEmail: subject.facultyId?.email || "",
      facultyPassword: ""
    });
    setShowFacultyPassword(false);
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete this subject? This action cannot be undone.")) return;
    try {
      await api.delete(`/subjects/${id}`);
      emitToast({ type: "success", title: "Deleted", message: "Subject deleted." });
      if (editingId === id) {
        resetForm();
      }
      load();
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to delete subject");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} subject(s)? This action cannot be undone.`)) return;
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/subjects/${id}`)));
      emitToast({ type: "success", title: "Deleted", message: "Selected subjects deleted." });
      setSelectedIds(new Set());
      if (editingId && selectedIds.has(editingId)) {
        resetForm();
      }
      load();
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to delete selected subjects");
    }
  };

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [search]);

  const safePage = Math.min(page, totalPages);
  const displaySubjects = showAll ? subjects : subjects.slice(0, 5);

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
      setSelectedIds(new Set(displaySubjects.map((s) => s._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = displaySubjects.length > 0 && displaySubjects.every((s) => selectedIds.has(s._id));

  const missingFacultyEmail = subjects.filter((s) => !s.facultyId?.email).length;

  return (
    <AppLayout title="Subjects">
      <RoleGate roles={["Admin", "Faculty"]}>
        <form className="card-panel p-6 grid md:grid-cols-3 gap-4" onSubmit={addOrUpdateSubject}>
          {formError && <p className="md:col-span-3 text-rose-600 text-sm">{formError}</p>}
          <FormInput label="Faculty Subject ID" name="subjectId" value={form.subjectId} onChange={handleChange} required />
          <FormInput label="Faculty Subject Name" name="subjectName" value={form.subjectName} onChange={handleChange} required />
          <RoleGate roles={["Admin"]}>
            <FormInput label="Faculty ID" name="facultyCode" value={form.facultyCode} onChange={handleChange} />
            <FormInput label="Faculty Name" name="facultyName" value={form.facultyName} onChange={handleChange} required />
            <FormInput label="Faculty Email" name="facultyEmail" type="email" value={form.facultyEmail} onChange={handleChange} required />
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-700">Password</span>
              <div className="relative">
                <input
                  name="facultyPassword"
                  type={showFacultyPassword ? "text" : "password"}
                  value={form.facultyPassword}
                  onChange={handleChange}
                  placeholder="Required for new faculty"
                  className="w-full px-3 py-2 pr-16 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  type="button"
                  onClick={() => setShowFacultyPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 my-auto h-7 w-8 flex items-center justify-center text-xs rounded border border-slate-200 bg-white"
                  style={{ color: "#111827" }}
                  aria-label={showFacultyPassword ? "Hide password" : "Show password"}
                  title={showFacultyPassword ? "Hide password" : "Show password"}
                >
                  {showFacultyPassword ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
                      <path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c5 0 9.3 3.1 11 8-1 2.7-2.9 4.8-5.2 6.1" />
                      <path d="M6.6 6.6C4.6 8 3.1 9.9 2 12c1.7 4.9 6 8 10 8 1.2 0 2.4-.2 3.5-.6" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.5-8 10-8 10 8 10 8-3.5 8-10 8S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
          </RoleGate>
          {user?.role === "Faculty" ? (
            <p className="md:col-span-3 text-xs text-slate-600">
              Subjects you add are automatically assigned to your faculty account. Only Admin can add a new faculty.
            </p>
          ) : null}
          <div className="md:col-span-3 flex gap-3">
            <button className="flex-1 px-4 py-2 rounded-lg bg-ink text-white">
              {editingId ? "Update Subject" : "Add Subject"}
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
        {pageError && (
          <div className="card-panel p-4 mb-4 border border-rose-200 bg-rose-50">
            <p className="text-sm text-rose-700">{pageError}</p>
          </div>
        )}
        <div className="card-panel p-4 mb-4">
          <FormInput
            label="Search Subjects"
            name="subjectSearch"
            placeholder="Search by ID, name, or faculty"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Subjects</p>
            <p className="text-2xl font-semibold text-ink">{totalSubjects}</p>
          </div>
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Missing Faculty Email</p>
            <p className="text-2xl font-semibold text-amber-700">{missingFacultyEmail}</p>
            <p className="text-xs text-slate-500 mt-1">Why it matters: missing contact slows coordination.</p>
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
                        aria-label="Select all subjects in view"
                        checked={allSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                      <span className="text-[11px] tracking-wide">Select</span>
                    </label>
                  </th>
                </RoleGate>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty Email</th>
                <RoleGate roles={["Admin", "Faculty"]}>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </RoleGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displaySubjects.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="w-12 px-3 py-4 text-sm">
                      <input
                        type="checkbox"
                        aria-label={`Select ${s.subjectName || "subject"}`}
                        checked={selectedIds.has(s._id)}
                        onChange={() => toggleRow(s._id)}
                      />
                    </td>
                  </RoleGate>
                  <td className="px-6 py-4 text-sm">{s.subjectId}</td>
                  <td className="px-6 py-4 text-sm">{s.subjectName}</td>
                  <td className="px-6 py-4 text-sm">{s.facultyId?.facultyCode || "N/A"}</td>
                  <td className="px-6 py-4 text-sm">{s.facultyId?.name || "Faculty"}</td>
                  <td className="px-6 py-4 text-sm">{s.facultyId?.email || "N/A"}</td>
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <button
                        onClick={() => startEdit(s)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-sky-600 text-white hover:bg-sky-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSubject(s._id)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Delete
                      </button>
                    </td>
                  </RoleGate>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-600" colSpan={user?.role === "Student" ? 5 : 7}>
                    {user?.role === "Student"
                      ? "No subjects found for your profile yet."
                      : "No subjects found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {subjects.length > 5 && (
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
          totalItems={totalSubjects}
          itemLabel="subjects"
          onPageChange={setPage}
        />
      </div>
    </AppLayout>
  );
};

export default Subjects;

