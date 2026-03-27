import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import AppLayout from "../components/AppLayout";
import api, { getApiBaseURL } from "../services/api";
import useAuth from "../hooks/useAuth";

const StudentDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMyDashboardRoute = !id;

  useEffect(() => {
    if (!isMyDashboardRoute) return;
    if (user?.role && user.role !== "Student") {
      navigate("/dashboard", { replace: true });
    }
  }, [isMyDashboardRoute, navigate, user?.role]);

  useEffect(() => {
    const load = async () => {
      try {
        if (isMyDashboardRoute && user?.role && user.role !== "Student") {
          return;
        }
        const endpoint = isMyDashboardRoute
          ? "/students/me/dashboard"
          : `/students/${id}/dashboard`;
        const { data: result } = await api.get(endpoint);
        setData(result);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load student dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isMyDashboardRoute, user?.role]);

  const downloadReport = async () => {
    if (id) {
      window.open(`${getApiBaseURL()}/reports/student/${id}/pdf`, "_blank");
    }
  };

  if (loading) {
    return (
      <AppLayout title="Loading...">
        <p>Loading student data...</p>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout title="Student Dashboard">
        <p>{error || "Student not found"}</p>
        {user?.role === "Student" && (
          <p className="text-sm text-slate-600 mt-2">
            Ask Admin/Faculty to create your student profile with matching name or email.
          </p>
        )}
      </AppLayout>
    );
  }

  const getRiskColor = (risk) => {
    if (risk === "Low") return "text-green-600 bg-green-100";
    if (risk === "Medium") return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getStabilityColor = (stability) => {
    if (stability === "Stable") return "text-black bg-gray-200";
    if (stability === "Improving") return "text-green-600 bg-green-100";
    return "text-orange-600 bg-orange-100";
  };

  return (
    <AppLayout title={`${data.student.name} - Dashboard`}>
      {!isMyDashboardRoute && (
        <button
          onClick={() => navigate("/students")}
          className="mb-4 px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back to Students
        </button>
      )}

      <div className="card-panel p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sky-600 text-white flex items-center justify-center text-2xl font-bold">
            {data.student.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-ink">{data.student.name}</h2>
            <p className="text-gray-600">{data.student.studentId} | {data.student.department} | Year {data.student.year}</p>
            {data.student.email && <p className="text-gray-600 text-sm mt-1">{data.student.email}</p>}
          </div>
          {!isMyDashboardRoute && (
            <button onClick={downloadReport} className="px-4 py-2 bg-ink text-white rounded-lg hover:bg-gray-800">
              Download Report
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card-panel p-4">
          <p className="text-sm text-gray-600">Average Score</p>
          <p className="text-3xl font-bold text-ink">{data.averageScore.toFixed(1)}%</p>
        </div>
        <div className="card-panel p-4">
          <p className="text-sm text-gray-600">Attendance</p>
          <p className="text-3xl font-bold text-ink">{data.overallAttendance.toFixed(1)}%</p>
        </div>
        <div className="card-panel p-4">
          <p className="text-sm text-gray-600">Stability</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStabilityColor(data.stability)}`}>
            {data.stability}
          </span>
        </div>
        <div className="card-panel p-4">
          <p className="text-sm text-gray-600">Risk Level</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(data.riskLevel)}`}>
            {data.riskLevel}
          </span>
          {data.riskDrivers?.length ? (
            <p className="text-xs text-slate-600 mt-2">Drivers: {data.riskDrivers.join(", ")}</p>
          ) : null}
        </div>
      </div>

      <div className="card-panel p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Feedback Summary</h3>
          <span className="text-xs text-slate-500">Latest signals</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            Great: {data.feedbackSummary?.great ?? 0}
          </span>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
            Average: {data.feedbackSummary?.average ?? 0}
          </span>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
            Poor: {data.feedbackSummary?.poor ?? 0}
          </span>
          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Total: {data.feedbackSummary?.total ?? 0}
          </span>
        </div>
      </div>

      <div className="card-panel p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.performanceTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="test" />
            <YAxis />
            <Tooltip
              formatter={(value) => [`${value}`, "marks"]}
              labelFormatter={(label, payload) => {
                const subject = payload?.[0]?.payload?.subject;
                return subject ? `${label} - ${subject}` : label;
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="marks" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card-panel p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Student Performance Overview</h3>
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
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="py-3 px-4 text-sm text-slate-600">{data.student.studentId}</td>
                <td className="py-3 px-4 text-sm text-slate-900">{data.student.name}</td>
                <td className="py-3 px-4 text-lg font-semibold text-slate-900">{data.averageScore.toFixed(1)}</td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStabilityColor(data.stability)}`}>
                    {data.stability}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="card-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Subject-wise Marks</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data.subjectMarks}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="average" fill="#0ea5e9" barSize={20} name="Score" />
              <Line type="monotone" dataKey="average" stroke="#f97316" strokeWidth={2} name="Score" dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card-panel p-6">
          <h3 className="text-lg font-semibold mb-4">Subject-wise Attendance</h3>
          <div className="space-y-4">
            {data.subjectAttendance.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{item.subject}</span>
                  <span className="text-sm font-semibold">{item.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default StudentDashboard;
