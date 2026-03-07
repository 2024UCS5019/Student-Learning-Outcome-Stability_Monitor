import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import useAuth from "../hooks/useAuth";

const Register = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "Student"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const passwordHint = "At least 8 chars with uppercase, lowercase, number, and symbol";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (user.role !== "Admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, user]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPassword.test(form.password)) {
      setError(passwordHint);
      return;
    }

    try {
      await register(form);
      setSuccess(`${form.role} account created successfully`);
      setForm({ username: "", password: "", role: form.role });
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
        {success ? <p className="text-emerald-600 text-sm mt-3">{success}</p> : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <FormInput label="Username" name="username" value={form.username} onChange={handleChange} required />
          <FormInput
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
          <p className="text-xs muted -mt-2">{passwordHint}</p>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-700">Role</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg border border-slate-200"
            >
              <option>Student</option>
              <option>Faculty</option>
            </select>
          </label>

          <button className="w-full py-2 rounded-lg bg-ink text-white">Create Account</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
