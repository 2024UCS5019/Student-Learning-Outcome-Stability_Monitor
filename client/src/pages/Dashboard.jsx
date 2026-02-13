import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import AppLayout from "../components/AppLayout";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import StatusPill from "../components/StatusPill";
import api from "../services/api";
import { avg, formatPercent } from "../utils/format";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stability, setStability] = useState([]);

  const load = async () => {
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
  };

  useEffect(() => {
    load();
    const socket = io(socketUrl, { transports: ["websocket"] });
    const refresh = () => load();
    socket.on("marks:created", refresh);
    socket.on("marks:updated", refresh);
    socket.on("marks:deleted", refresh);
    socket.on("attendance:created", refresh);
    socket.on("attendance:updated", refresh);
    socket.on("attendance:deleted", refresh);
    socket.on("stability:updated", refresh);
    return () => socket.disconnect();
  }, []);

  const lineData = useMemo(() => {
    return marks.map((m, idx) => ({
      label: m.testName || `Test ${idx + 1}`,
      score: m.marks
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
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={students.length} subtitle="Active records" />
        <StatCard title="Average Score" value={avgMarks.toFixed(1)} subtitle="Across all tests" />
        <StatCard title="Attendance Avg" value={formatPercent(avg(attendance.map((a) => a.percentage)))} />
      </div>

      <div className="grid xl:grid-cols-3 gap-6 mt-8">
        <ChartCard title="Performance Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <XAxis dataKey="label" />
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
              <Bar dataKey="avg" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Attendance Composition">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={idx % 2 ? "#f97316" : "#0ea5e9"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="card-panel p-6 mt-8">
        <h3 className="section-title mb-4">Stability Status</h3>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stability.map((s) => (
            <div key={s._id} className="border border-slate-200 rounded-xl p-4">
              <p className="text-sm text-slate-600">{s.studentId?.name || "Student"}</p>
              <p className="text-lg font-semibold text-slate-900 mt-1">{s.average}</p>
              <div className="mt-2">
                <StatusPill status={s.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
