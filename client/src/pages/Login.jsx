import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import useAuth from "../hooks/useAuth";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.username, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="app-bg min-h-screen flex items-center justify-center px-4">
      <div className="card-panel p-8 w-full max-w-md">
        <h1 className="font-display text-3xl text-ink">Welcome back</h1>
        <p className="muted text-sm mt-1">Sign in to manage outcomes</p>
        {error ? <p className="text-rose-600 text-sm mt-3">{error}</p> : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <FormInput
            label="Username"
            name="username"
            type="text"
            onChange={handleChange}
            required
          />
          <FormInput
            label="Password"
            name="password"
            type="password"
            onChange={handleChange}
            required
          />
          <button className="w-full py-2 rounded-lg bg-ink text-white">Login</button>
        </form>

        <p className="muted text-sm mt-4">Accounts are created by Admin only.</p>
      </div>
    </div>
  );
};

export default Login;
