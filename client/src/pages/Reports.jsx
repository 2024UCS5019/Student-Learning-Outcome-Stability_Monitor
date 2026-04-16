import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import api from "../services/api";

const Reports = () => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMyStudent = async () => {
      if (user?.role !== "Student") return;
      try {
        const { data } = await api.get("/students/me");
        setStudentId(data?._id || "");
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load your student profile");
      }
    };
    loadMyStudent();
  }, [user?.role]);

  const triggerDownload = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadStudentReport = async () => {
    setError("");
    const targetId = user?.role === "Student" ? studentId : studentId.trim();
    if (!targetId) {
      setError("Please enter Student ID.");
      return;
    }

    try {
      const { data } = await api.get(`/reports/student/${targetId}?format=pdf`, {
        responseType: "blob"
      });
      triggerDownload(data, "student-report.pdf");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to download student report");
    }
  };

  return (
    <AppLayout title="Reports">
      <div className="card-panel p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {error ? <p className="sm:col-span-2 md:col-span-3 text-sm text-rose-600">{error}</p> : null}
        {user?.role !== "Student" && (
          <FormInput
            label="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
        )}
        {user?.role !== "Student" && (
          <FormInput label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
        )}
        {user?.role !== "Student" && (
          <FormInput label="Year" value={year} onChange={(e) => setYear(e.target.value)} />
        )}

        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-ink text-white text-center sm:col-span-2 md:col-span-3"
          onClick={downloadStudentReport}
        >
          Download Student Report (PDF)
        </button>
      </div>
    </AppLayout>
  );
};

export default Reports;
