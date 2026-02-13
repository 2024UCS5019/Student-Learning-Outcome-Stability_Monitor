import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDashboard from "./pages/StudentDashboard";
import Subjects from "./pages/Subjects";
import Marks from "./pages/Marks";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/auth/callback" element={<AuthCallback />} />

    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/students"
      element={
        <ProtectedRoute>
          <Students />
        </ProtectedRoute>
      }
    />
    <Route
      path="/students/:id"
      element={
        <ProtectedRoute>
          <StudentDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/subjects"
      element={
        <ProtectedRoute>
          <Subjects />
        </ProtectedRoute>
      }
    />
    <Route
      path="/marks"
      element={
        <ProtectedRoute>
          <Marks />
        </ProtectedRoute>
      }
    />
    <Route
      path="/attendance"
      element={
        <ProtectedRoute>
          <Attendance />
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default App;
