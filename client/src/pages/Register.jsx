import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import useAuth from "../hooks/useAuth";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Student"
  });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-4">
      <div className="card-panel p-8 w-full max-w-md">
        <h1 className="font-display text-3xl text-ink">Create account</h1>
        <p className="muted text-sm mt-1">Track outcomes with clarity</p>
        {error ? <p className="text-rose-600 text-sm mt-3">{error}</p> : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <FormInput label="Full Name" name="name" onChange={handleChange} required />
          <FormInput label="Email" name="email" type="email" onChange={handleChange} required />
          <FormInput label="Password" name="password" type="password" onChange={handleChange} required />

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-700">Role</span>
            <select
              name="role"
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border border-slate-200"
            >
              <option>Student</option>
              <option>Faculty</option>
              <option>Admin</option>
            </select>
          </label>

          <button className="w-full py-2 rounded-lg bg-ink text-white">Register</button>
        </form>
        <p className="muted text-sm mt-4">
          Already have an account? <Link to="/login" className="text-sky-600">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
