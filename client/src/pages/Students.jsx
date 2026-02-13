import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import Table from "../components/Table";
import RoleGate from "../components/RoleGate";
import api from "../services/api";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortMode, setSortMode] = useState("name"); // "name" | "id"
  const [form, setForm] = useState({
    studentId: "",
    name: "",
    department: "",
    year: ""
  });

  const load = async () => {
    const { data } = await api.get("/students");
    setStudents(data);
  };

  useEffect(() => {
    load();
    const socket = io(socketUrl, { transports: ["websocket"] });
    socket.on("students:updated", load);
    return () => socket.disconnect();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addStudent = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/students", { ...form, year: Number(form.year) });
      setForm({ studentId: "", name: "", department: "", year: "" });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Student ID already exists or invalid data");
    }
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Delete this student? This action cannot be undone.")) return;
    try {
      await api.delete(`/students/${id}`);
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete student");
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
      setError(err?.response?.data?.message || "Failed to delete selected students");
    }
  };

  const filteredStudents = students.filter((s) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (s.studentId || "").toLowerCase().includes(query) ||
      (s.name || "").toLowerCase().includes(query) ||
      (s.department || "").toLowerCase().includes(query) ||
      String(s.year || "").toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    if (sortMode === "name") {
      const nameCompare = (a.name || "").localeCompare(b.name || "");
      if (nameCompare !== 0) return nameCompare;
      return (a.studentId || "").localeCompare(b.studentId || "");
    }
    return (a.studentId || "").localeCompare(b.studentId || "");
  });

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
      setSelectedIds(new Set(filteredStudents.map((s) => s._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length;

  return (
    <AppLayout title="Students">
      <RoleGate roles={["Admin"]}>
        <form className="card-panel p-6 grid md:grid-cols-4 gap-4" onSubmit={addStudent}>
          {error && <p className="md:col-span-4 text-rose-600 text-sm">{error}</p>}
          <FormInput label="Student ID" name="studentId" value={form.studentId} onChange={handleChange} required />
          <FormInput label="Name" name="name" value={form.name} onChange={handleChange} required />
          <FormInput label="Department" name="department" value={form.department} onChange={handleChange} required />
          <FormInput label="Year" name="year" value={form.year} onChange={handleChange} required />
          <button className="md:col-span-4 px-4 py-2 rounded-lg bg-ink text-white">Add Student</button>
        </form>
      </RoleGate>

      <div className="mt-6">
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
          <RoleGate roles={["Admin"]}>
            <div className="text-sm text-slate-600">
              Selected: {selectedIds.size}
            </div>
          </RoleGate>
        </div>
        <RoleGate roles={["Admin"]}>
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
                <RoleGate roles={["Admin"]}>
                  <th className="w-12 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <label className="inline-flex items-center gap-1 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleAll(e.target.checked)}
                      />
                      <span className="text-[11px] tracking-wide">Select</span>
                    </label>
                  </th>
                </RoleGate>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <RoleGate roles={["Admin"]}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </RoleGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((s) => (
                <tr key={s._id} onClick={() => navigate(`/students/${s._id}`)} className="hover:bg-gray-50 cursor-pointer">
                  <RoleGate roles={["Admin"]}>
                    <td className="w-12 px-3 py-4 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s._id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleRow(s._id)}
                      />
                    </td>
                  </RoleGate>
                  <td className="px-6 py-4 text-sm">{s.studentId}</td>
                  <td className="px-6 py-4 text-sm">{s.name}</td>
                  <td className="px-6 py-4 text-sm">{s.department}</td>
                  <td className="px-6 py-4 text-sm">{s.year}</td>
                  <RoleGate roles={["Admin"]}>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStudent(s._id);
                        }}
                        className="px-3 py-1.5 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700"
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
      </div>
    </AppLayout>
  );
};

export default Students;
