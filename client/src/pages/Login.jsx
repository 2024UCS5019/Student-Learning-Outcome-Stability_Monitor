import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getApiBaseURL } from "../services/api";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    if (oauthError) setError(oauthError);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      if (!err?.response) {
        setError("Cannot connect to server. Please ensure backend is running on port 5001.");
        return;
      }
      setError(err?.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="app-bg min-h-screen px-3 py-4 sm:py-5 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/95 p-4 sm:p-5 shadow-panel">
        <h1 className="font-display text-base text-ink sm:text-lg">Login</h1>
        <p className="mt-1.5 text-sm text-slate-600">Access your account</p>

        {error ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <form className="mt-3.5 space-y-2.5" onSubmit={handleSubmit} autoComplete="on" method="post">
          <label className="block">
            <span className="mb-1 block text-base font-semibold text-slate-900">Email</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-black">
              <svg
                className="h-4 w-4 text-slate-700"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M16 12a4 4 0 1 0-4 4h1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M12 19a7 7 0 1 1 6.13-3.62"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M18 9v5c0 .55.45 1 1 1s1-.45 1-1v-2.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input
                name="email"
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your Email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-500 outline-none"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-base font-semibold text-slate-900">Password</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-black">
              <svg
                className="h-4 w-4 text-slate-700"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="4.5"
                  y="10"
                  width="15"
                  height="10"
                  rx="1.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M8 10V7.5A4 4 0 0 1 12 3.5a4 4 0 0 1 4 4V10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <input
                name="password"
                id="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your Password"
                autoComplete="current-password"
                className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-500 outline-none"
                required
              />
            </div>
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-black"
            />
            Remember me
          </label>

          <button className="mt-1 w-full rounded-xl bg-[#0b0f14] py-2.5 text-base font-semibold text-white transition hover:bg-[#11161d]">
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-900">
          Don't have an account?{" "}
          <Link className="font-semibold text-black hover:text-gray-700" to="/register">
            Sign Up
          </Link>
        </p>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              const apiUrl = getApiBaseURL();
              window.location.href = `${apiUrl}/auth/google`;
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            <span className="text-base text-rose-400">G</span>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
