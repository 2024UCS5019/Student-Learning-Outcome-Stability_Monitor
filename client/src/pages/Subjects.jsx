import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import RoleGate from "../components/RoleGate";
import api from "../services/api";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [form, setForm] = useState({
    subjectId: "",
    subjectName: "",
    facultyId: ""
  });

  const load = async () => {
    const { data } = await api.get("/subjects");
    setSubjects(data);
  };

  const loadFaculties = async () => {
    const { data } = await api.get("/auth/users?role=Faculty");
    setFaculties(data);
  };

  useEffect(() => {
    load();
    loadFaculties();
    const socket = io(socketUrl, { transports: ["websocket"] });
    socket.on("subjects:updated", load);
    return () => socket.disconnect();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addSubject = async (e) => {
    e.preventDefault();
    await api.post("/subjects", form);
    setForm({ subjectId: "", subjectName: "", facultyId: "" });
    load();
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete this subject? This action cannot be undone.")) return;
    await api.delete(`/subjects/${id}`);
    load();
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} subject(s)? This action cannot be undone.`)) return;
    await Promise.all([...selectedIds].map((id) => api.delete(`/subjects/${id}`)));
    setSelectedIds(new Set());
    load();
  };

  const filteredSubjects = subjects.filter((s) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (s.subjectId || "").toLowerCase().includes(query) ||
      (s.subjectName || "").toLowerCase().includes(query) ||
      (s.facultyId?.name || "").toLowerCase().includes(query)
    );
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
      setSelectedIds(new Set(filteredSubjects.map((s) => s._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = filteredSubjects.length > 0 && selectedIds.size === filteredSubjects.length;

  return (
    <AppLayout title="Subjects">
      <RoleGate roles={["Admin"]}>
        <form className="card-panel p-6 grid md:grid-cols-3 gap-4" onSubmit={addSubject}>
          <FormInput label="Subject ID" name="subjectId" value={form.subjectId} onChange={handleChange} required />
          <FormInput label="Subject Name" name="subjectName" value={form.subjectName} onChange={handleChange} required />
          <div>
            <label className="block text-sm font-medium mb-1">Faculty</label>
            <select name="facultyId" value={form.facultyId} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg">
              <option value="">Select Faculty</option>
              {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>
          <button className="md:col-span-3 px-4 py-2 rounded-lg bg-ink text-white">Add Subject</button>
        </form>
      </RoleGate>

      <div className="mt-6">
        <div className="card-panel p-4 mb-4">
          <FormInput
            label="Search Subjects"
            name="subjectSearch"
            placeholder="Search by ID, name, or faculty"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <RoleGate roles={["Admin"]}>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                <RoleGate roles={["Admin"]}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </RoleGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubjects.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <RoleGate roles={["Admin"]}>
                    <td className="w-12 px-3 py-4 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s._id)}
                        onChange={() => toggleRow(s._id)}
                      />
                    </td>
                  </RoleGate>
                  <td className="px-6 py-4 text-sm">{s.subjectId}</td>
                  <td className="px-6 py-4 text-sm">{s.subjectName}</td>
                  <td className="px-6 py-4 text-sm">{s.facultyId?.name || "Faculty"}</td>
                  <RoleGate roles={["Admin"]}>
                    <td className="px-6 py-4 text-sm">
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
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Subjects;
