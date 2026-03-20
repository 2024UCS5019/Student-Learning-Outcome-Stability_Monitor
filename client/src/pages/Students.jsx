import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import Table from "../components/Table";
import RoleGate from "../components/RoleGate";
import PaginationControls from "../components/PaginationControls";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const Students = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortMode, setSortMode] = useState("name"); // "name" | "id"
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState({
    studentId: "",
    name: "",
    department: "",
    year: "",
    email: "",
    password: ""
  });
  const canManageStudents = user?.role === "Admin" || user?.role === "Faculty";

  if (user?.role === "Student") {
    return <Navigate to="/my-dashboard" replace />;
  }

  const pageSize = 10;
  const load = async () => {
    try {
      const { data } = await api.get("/students", {
        params: {
          page,
          limit: pageSize,
          search: search.trim() || undefined,
          sort: sortMode
        }
      });
      if (Array.isArray(data)) {
        setStudents(data);
        setTotalStudents(data.length);
        setTotalPages(1);
      } else {
        setStudents(data.items || []);
        setTotalStudents(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
      setPageError("");
    } catch (err) {
      setPageError(err?.response?.data?.message || "Unable to load students");
      setStudents([]);
      setTotalStudents(0);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    if (canManageStudents) {
      load();
    } else {
      setStudents([]);
      setPageError("Only Admin or Faculty can add and manage student details.");
    }
    const socket = io(socketUrl);
    socket.on("students:updated", () => {
      if (canManageStudents) load();
    });
    return () => socket.disconnect();
  }, [canManageStudents, page, sortMode, search]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ studentId: "", name: "", department: "", year: "", email: "", password: "" });
    setShowPassword(false);
    setEditingId("");
  };

  const addOrUpdateStudent = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const payload = { ...form, year: Number(form.year) };
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
      } else {
        await api.post("/students", payload);
      }
      resetForm();
      load();
    } catch (err) {
      setFormError(err?.response?.data?.message || (editingId ? "Failed to update student" : "Student ID already exists or invalid data"));
    }
  };

  const startEdit = (student) => {
    setFormError("");
    setEditingId(student._id);
    setForm({
      studentId: student.studentId || "",
      name: student.name || "",
      department: student.department || "",
      year: String(student.year || ""),
      email: student.email || "",
      password: ""
    });
    setShowPassword(false);
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student? This action cannot be undone.")) return;
    try {
      await api.delete(`/students/${id}`);
      load();
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to delete student");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} student(s)? This action cannot be undone.`)) return;
    try {
      await Promise.all([...selectedIds].map((id) => api.delete(`/students/${id}`)));
      setSelectedIds(new Set());
      load();
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to delete selected students");
    }
  };

  const toggleBlock = async (student) => {
    try {
      if (student.isBlocked) {
        await api.patch(`/students/${student._id}/unblock`);
      } else {
        await api.patch(`/students/${student._id}/block`);
      }
      load();
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to update block status");
    }
  };

  useEffect(() => {
    setPage(1);
    setShowAll(false);
  }, [search, sortMode]);

  const safePage = Math.min(page, totalPages);
  const displayStudents = showAll ? students : students.slice(0, 5);

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
      setSelectedIds(new Set(displayStudents.map((s) => s._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = displayStudents.length > 0 && displayStudents.every((s) => selectedIds.has(s._id));

  const blockedCount = students.filter((s) => s.hasAccount && s.isBlocked).length;
  const noAccountCount = students.filter((s) => !s.hasAccount).length;

  return (
    <AppLayout title="Students">
      <RoleGate roles={["Admin", "Faculty"]}>
        <form className="card-panel p-6 grid md:grid-cols-4 gap-4" onSubmit={addOrUpdateStudent}>
          {formError && <p className="md:col-span-4 text-rose-600 text-sm">{formError}</p>}
          <FormInput label="Student ID" name="studentId" value={form.studentId} onChange={handleChange} required />
          <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required />
          <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} />
          <FormInput label="Department" name="department" value={form.department} onChange={handleChange} required />
          <FormInput label="Year" name="year" value={form.year} onChange={handleChange} required />
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-700">Password</span>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                minLength={8}
                placeholder="Optional (Admin only)"
                disabled={user?.role !== "Admin"}
                className="w-full px-3 py-2 pr-16 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-slate-100 disabled:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={user?.role !== "Admin"}
                className="absolute inset-y-0 right-2 my-auto h-7 w-8 flex items-center justify-center text-xs rounded border border-slate-200 bg-white text-slate-700 disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
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
          <div className="md:col-span-4 flex gap-3">
            <button className="flex-1 px-4 py-2 rounded-lg bg-ink text-white">
              {editingId ? "Update Student" : "Add Student"}
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
      {!canManageStudents && (
        <div className="card-panel p-4 text-sm text-amber-700">
          You are logged in as <span className="font-semibold">{user?.role || "User"}</span>. Only Admin or Faculty can add student details.
        </div>
      )}

      <div className="mt-6">
        {pageError && (
          <div className="card-panel p-4 mb-4 text-sm text-rose-600">
            {pageError}
          </div>
        )}
        <div className="card-panel p-4 mb-4">
          <FormInput
            label="Search Students"
            name="studentSearch"
            placeholder="Search by ID, name, department, or year"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortMode("name")}
              className={`px-3 py-1.5 rounded-lg text-sm ${sortMode === "name" ? "bg-ink text-white" : "bg-gray-100 text-gray-700"}`}
            >
              A → Z
            </button>
            <button
              onClick={() => setSortMode("id")}
              className={`px-3 py-1.5 rounded-lg text-sm ${sortMode === "id" ? "bg-ink text-white" : "bg-gray-100 text-gray-700"}`}
            >
              ID ↑
            </button>
          </div>
          <RoleGate roles={["Admin", "Faculty"]}>
            <div className="text-sm text-slate-600">
              Selected: {selectedIds.size}
            </div>
          </RoleGate>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Students</p>
            <p className="text-2xl font-semibold text-ink">{totalStudents}</p>
          </div>
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Blocked Accounts</p>
            <p className="text-2xl font-semibold text-rose-700">{blockedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Why it matters: blocked users miss updates.</p>
          </div>
          <div className="card-panel p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">No Account</p>
            <p className="text-2xl font-semibold text-amber-700">{noAccountCount}</p>
            <p className="text-xs text-slate-500 mt-1">Why it matters: no login means no visibility.</p>
          </div>
        </div>
        <RoleGate roles={["Admin", "Faculty"]}>
          <div className="flex items-center justify-end mb-3">
            <button
              onClick={deleteSelected}
              disabled={selectedIds.size === 0}
              className="px-4 py-2 rounded-lg text-sm bg-rose-600 text-white disabled:opacity-50 hover:bg-rose-700"
            >
              Delete Selected
            </button>
          </div>
        </RoleGate>
        <div className="card-panel overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <RoleGate roles={["Admin", "Faculty"]}>
                  <th scope="col" className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <label className="inline-flex items-center gap-1 whitespace-nowrap">
                      <input
                        type="checkbox"
                        aria-label="Select all students in view"
                        checked={allSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                      <span className="text-[11px] tracking-wide">Select</span>
                    </label>
                  </th>
                </RoleGate>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <RoleGate roles={["Admin", "Faculty"]}>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </RoleGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayStudents.map((s) => (
                <tr key={s._id} onClick={() => navigate(`/students/${s._id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="w-12 px-3 py-4 text-sm">
                      <input
                        type="checkbox"
                        aria-label={`Select ${s.name || "student"}`}
                        checked={selectedIds.has(s._id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleRow(s._id)}
                      />
                    </td>
                  </RoleGate>
                  <td className="px-6 py-4 text-sm">{s.studentId}</td>
                  <td className="px-6 py-4 text-sm">{s.name}</td>
                  <td className="px-6 py-4 text-sm">{s.email || "N/A"}</td>
                  <td className="px-6 py-4 text-sm">{s.department}</td>
                  <td className="px-6 py-4 text-sm">{s.year}</td>
                  <td className="px-6 py-4 text-sm">
                    {s.hasAccount ? (s.isBlocked ? "Blocked" : "Active") : "No Account"}
                  </td>
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="px-6 py-4 text-sm flex items-center gap-2">
                      <RoleGate roles={["Admin", "Faculty"]}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(s);
                          }}
                          className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-sky-700 text-white hover:bg-sky-800 transition-colors"
                        >
                          Edit
                        </button>
                      </RoleGate>
                      <RoleGate roles={["Admin", "Faculty"]}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBlock(s);
                          }}
                          disabled={!s.hasAccount}
                          title={s.hasAccount ? (s.isBlocked ? "Unblock student" : "Block student") : "No account to block"}
                          className={`px-3 py-1.5 text-sm font-semibold rounded-lg text-white border transition-all disabled:opacity-50 ${
                            s.isBlocked
                              ? "bg-emerald-600 hover:bg-emerald-700 border-transparent"
                              : "bg-amber-600 hover:bg-amber-700 border-slate-900"
                          }`}
                        >
                          {s.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </RoleGate>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStudent(s._id);
                        }}
                        className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </RoleGate>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {students.length > 5 && (
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
          totalItems={totalStudents}
          itemLabel="students"
          onPageChange={setPage}
        />
      </div>
    </AppLayout>
  );
};

export default Students;

