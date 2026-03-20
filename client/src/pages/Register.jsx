import { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Register = () => {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const passwordHint = "At least 8 chars with uppercase, lowercase, number, and symbol";

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: "Student"
      });
      setSuccess("Account created successfully. You can login now.");
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err?.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="app-bg min-h-screen px-3 py-4 sm:py-5 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-4 sm:p-5 shadow-panel">
        <h1 className="font-display text-base text-ink sm:text-lg">Create account</h1>
        <p className="mt-1.5 text-sm text-slate-600">Track outcomes with clarity</p>

        {error ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <form className="mt-3.5 space-y-2.5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-base font-semibold text-slate-900">Name</span>
            <input
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your Name"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-700 placeholder:text-slate-500 outline-none focus:border-black"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-base font-semibold text-slate-900">Email</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your Email"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-700 placeholder:text-slate-500 outline-none focus:border-black"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-base font-semibold text-slate-900">Password</span>
            <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-black">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your Password"
                minLength={8}
                className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-500 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="ml-2 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 5.09A9.78 9.78 0 0 1 12 5c7 0 10 7 10 7a17.44 17.44 0 0 1-3.06 4.44" />
                    <path d="M6.61 6.61C3.67 8.27 2 12 2 12a17.52 17.52 0 0 0 5 5.39" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <p className="text-sm text-slate-600 -mt-1">{passwordHint}</p>

          <button className="mt-1 w-full rounded-xl bg-[#0b0f14] py-2.5 text-base font-semibold text-white transition hover:bg-[#11161d]">
            Create Account
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-900">
          Already have an account?{" "}
          <Link className="text-black font-semibold hover:text-gray-700" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
