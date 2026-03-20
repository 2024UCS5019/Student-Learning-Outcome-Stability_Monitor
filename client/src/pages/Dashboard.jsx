import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import StatusPill from "../components/StatusPill";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { avg, formatPercent } from "../utils/format";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const defaultSocketUrl = () => {
  if (typeof window === "undefined") return "http://localhost:5001";
  const protocol = window.location.protocol === "https:" ? "https" : "http";
  return `${protocol}://${window.location.hostname}:5001`;
};

const socketUrl = import.meta.env.VITE_SOCKET_URL || defaultSocketUrl();

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stability, setStability] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Student users should always open their personal dashboard view.
    if (user?.role === "Student") {
      navigate("/my-dashboard", { replace: true });
    }
  }, [user, navigate]);

  const load = async () => {
    if (user?.role === "Student") return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError("You appear to be offline. Turn off Offline mode in DevTools or reconnect, then refresh.");
      return;
    }

    try {
      const [s, m, a, st] = await Promise.all([
        api.get("/students"),
        api.get("/marks"),
        api.get("/attendance"),
        api.get("/stability")
      ]);
      setStudents(s.data);
      setMarks(m.data);
      setAttendance(a.data);
      setStability(st.data);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load dashboard data. Ensure the backend is running on port 5001.");
    }
  };

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (user?.role === "Student") return;
    loadRef.current();

    const socket = io(socketUrl, {
      autoConnect: typeof navigator === "undefined" || navigator.onLine !== false
    });

    const refresh = () => loadRef.current();
    const onOnline = () => {
      if (socket.disconnected) socket.connect();
      loadRef.current();
    };
    const onOffline = () => socket.disconnect();

    socket.on("marks:created", refresh);
    socket.on("marks:updated", refresh);
    socket.on("marks:deleted", refresh);
    socket.on("attendance:created", refresh);
    socket.on("attendance:updated", refresh);
    socket.on("attendance:deleted", refresh);
    socket.on("stability:updated", refresh);

    if (typeof window !== "undefined") {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      }
      socket.off("marks:created", refresh);
      socket.off("marks:updated", refresh);
      socket.off("marks:deleted", refresh);
      socket.off("attendance:created", refresh);
      socket.off("attendance:updated", refresh);
      socket.off("attendance:deleted", refresh);
      socket.off("stability:updated", refresh);
      socket.disconnect();
    };
  }, [user?.role]);

  const lineData = useMemo(() => {
    const studentMap = {};
    marks.forEach((m) => {
      const studentName = m.studentId?.name || "Unknown";
      if (!studentMap[studentName]) {
        studentMap[studentName] = [];
      }
      studentMap[studentName].push(m.marks);
    });
    return Object.entries(studentMap).map(([label, scores]) => ({
      label,
      score: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
    }));
  }, [marks]);

  const barData = useMemo(() => {
    const map = {};
    marks.forEach((m) => {
      const name = m.subjectId?.subjectName || "Subject";
      map[name] = map[name] || [];
      map[name].push(m.marks);
    });
    return Object.entries(map).map(([name, values]) => ({
      name,
      avg: Number(avg(values).toFixed(1))
    }));
  }, [marks]);

  const pieData = useMemo(() => {
    const map = {};
    attendance.forEach((a) => {
      const name = a.subjectId?.subjectName || "Subject";
      map[name] = map[name] || [];
      map[name].push(a.percentage);
    });
    return Object.entries(map).map(([name, values]) => ({
      name,
      value: Number(avg(values).toFixed(1))
    }));
  }, [attendance]);

  const avgMarks = avg(marks.map((m) => m.marks));

  return (
    <AppLayout title="Dashboard">
      {error && (
        <div className="card-panel p-4 mb-6 border border-rose-200 bg-rose-50">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={students.length} subtitle="Active records" />
        <StatCard title="Average Score" value={avgMarks.toFixed(1)} subtitle="Across all tests" />
        <StatCard title="Attendance Avg" value={formatPercent(avg(attendance.map((a) => a.percentage)))} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mt-8">
        <ChartCard title="Performance Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="label" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subject-wise Average Marks">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance Composition">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {pieData.map((_, idx) => {
                  const colors = ["#0ea5e9", "#22c55e", "#f97316"];
                  return <Cell key={idx} fill={colors[idx % colors.length]} />;
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card-panel p-6 mt-8">
        <h3 className="section-title mb-4">Student Performance Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Student ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Student</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Average Score</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {stability.map((s) => (
                <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm text-slate-600">{s.studentId?.studentId || "N/A"}</td>
                  <td className="py-3 px-4 text-sm text-slate-900">{s.studentId?.name || "Student"}</td>
                  <td className="py-3 px-4 text-lg font-semibold text-slate-900">{s.average}</td>
                  <td className="py-3 px-4"><StatusPill status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

