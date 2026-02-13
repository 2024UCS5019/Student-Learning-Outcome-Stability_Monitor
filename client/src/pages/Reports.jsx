import AppLayout from "../components/AppLayout";
import FormInput from "../components/FormInput";
import { useState } from "react";

const Reports = () => {
  const [studentId, setStudentId] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  return (
    <AppLayout title="Reports">
      <div className="card-panel p-6 grid md:grid-cols-3 gap-4">
        <FormInput label="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
        <FormInput label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <FormInput label="Year" value={year} onChange={(e) => setYear(e.target.value)} />

        <a
          className="px-4 py-2 rounded-lg bg-ink text-white text-center md:col-span-3"
          href={`${apiBase}/reports/student/${studentId}?format=pdf`}
          target="_blank"
          rel="noreferrer"
        >
          Download Student Report (PDF)
        </a>

        <a
          className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-center md:col-span-3"
          href={`${apiBase}/reports/class?department=${department}&year=${year}&format=csv`}
          target="_blank"
          rel="noreferrer"
        >
          Download Class Report (CSV)
        </a>
      </div>
    </AppLayout>
  );
};

export default Reports;
