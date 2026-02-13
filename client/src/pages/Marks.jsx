import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import RoleGate from "../components/RoleGate";
import api from "../services/api";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const Marks = () => {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [form, setForm] = useState({
    studentId: "",
    subjectId: "",
    testName: "",
    marks: ""
  });

  const load = async () => {
    const { data } = await api.get("/marks");
    setMarks(data);
  };

  const loadStudents = async () => {
    const { data } = await api.get("/students");
    setStudents(data);
  };

  const loadSubjects = async () => {
    const { data } = await api.get("/subjects");
    setSubjects(data);
  };

  useEffect(() => {
    load();
    loadStudents();
    loadSubjects();
    const socket = io(socketUrl, { transports: ["websocket"] });
    socket.on("marks:created", load);
    socket.on("marks:updated", load);
    socket.on("marks:deleted", load);
    return () => socket.disconnect();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addMark = async (e) => {
    e.preventDefault();
    await api.post("/marks", { ...form, marks: Number(form.marks) });
    setForm({ studentId: "", subjectId: "", testName: "", marks: "" });
    load();
  };

  const deleteMark = async (id) => {
    if (!window.confirm("Delete this mark entry? This action cannot be undone.")) return;
    await api.delete(`/marks/${id}`);
    load();
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} mark(s)? This action cannot be undone.`)) return;
    await Promise.all([...selectedIds].map((id) => api.delete(`/marks/${id}`)));
    setSelectedIds(new Set());
    load();
  };

  const sortedMarks = marks
    .sort((a, b) => (a.studentId?.name || "").localeCompare(b.studentId?.name || ""))
    .map((m) => m);

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
      setSelectedIds(new Set(sortedMarks.map((m) => m._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = sortedMarks.length > 0 && selectedIds.size === sortedMarks.length;

  return (
    <AppLayout title="Marks">
      <RoleGate roles={["Admin", "Faculty"]}>
        <form className="card-panel p-6 grid md:grid-cols-4 gap-4" onSubmit={addMark}>
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
          <button className="md:col-span-4 px-4 py-2 rounded-lg bg-ink text-white">Add Marks</button>
        </form>
      </RoleGate>

      <div className="mt-6">
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
        <div className="card-panel overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <RoleGate roles={["Admin", "Faculty"]}>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                <RoleGate roles={["Admin", "Faculty"]}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </RoleGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedMarks.map((m) => (
                <tr key={m._id} className="hover:bg-gray-50">
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="w-12 px-3 py-4 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(m._id)}
                        onChange={() => toggleRow(m._id)}
                      />
                    </td>
                  </RoleGate>
                  <td className="px-6 py-4 text-sm">{m.studentId?.name || "Student Name"}</td>
                  <td className="px-6 py-4 text-sm">{m.subjectId?.subjectName || "Subject Name"}</td>
                  <td className="px-6 py-4 text-sm">{m.testName}</td>
                  <td className="px-6 py-4 text-sm">{m.marks}</td>
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="px-6 py-4 text-sm">
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
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Marks;
