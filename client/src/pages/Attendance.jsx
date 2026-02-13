import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import RoleGate from "../components/RoleGate";
import api from "../services/api";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [form, setForm] = useState({
    studentId: "",
    subjectId: "",
    percentage: ""
  });

  const load = async () => {
    const { data } = await api.get("/attendance");
    setAttendance(data);
  };

  const loadOptions = async () => {
    const [studentsRes, subjectsRes] = await Promise.all([
      api.get("/students"),
      api.get("/subjects")
    ]);
    setStudents(studentsRes.data);
    setSubjects(subjectsRes.data);
  };

  useEffect(() => {
    load();
    loadOptions();
    const socket = io(socketUrl, { transports: ["websocket"] });
    socket.on("attendance:created", load);
    socket.on("attendance:updated", load);
    socket.on("attendance:deleted", load);
    return () => socket.disconnect();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addAttendance = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/attendance", { ...form, percentage: Number(form.percentage) });
      setForm({ studentId: "", subjectId: "", percentage: "" });
      load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to record attendance");
    }
  };

  const deleteAttendance = async (id) => {
    if (!window.confirm("Delete this attendance record? This action cannot be undone.")) return;
    await api.delete(`/attendance/${id}`);
    load();
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} attendance record(s)? This action cannot be undone.`)) return;
    await Promise.all([...selectedIds].map((id) => api.delete(`/attendance/${id}`)));
    setSelectedIds(new Set());
    load();
  };

  const sortedAttendance = [...attendance]
    .sort((a, b) => (a.studentId?.name || "").localeCompare(b.studentId?.name || ""))
    .map((a) => a);

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
      setSelectedIds(new Set(sortedAttendance.map((a) => a._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const allSelected = sortedAttendance.length > 0 && selectedIds.size === sortedAttendance.length;

  return (
    <AppLayout title="Attendance">
      <RoleGate roles={["Admin", "Faculty"]}>
        <form className="card-panel p-6 grid md:grid-cols-3 gap-4" onSubmit={addAttendance}>
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
          <button className="md:col-span-3 px-4 py-2 rounded-lg bg-ink text-white">Record Attendance</button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance</th>
                <RoleGate roles={["Admin", "Faculty"]}>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </RoleGate>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedAttendance.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="w-12 px-3 py-4 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(a._id)}
                        onChange={() => toggleRow(a._id)}
                      />
                    </td>
                  </RoleGate>
                  <td className="px-6 py-4 text-sm">{a.studentId?.name || "Student Name"}</td>
                  <td className="px-6 py-4 text-sm">{a.subjectId?.subjectName || "Subject Name"}</td>
                  <td className="px-6 py-4 text-sm">{a.percentage}%</td>
                  <RoleGate roles={["Admin", "Faculty"]}>
                    <td className="px-6 py-4 text-sm">
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
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Attendance;
