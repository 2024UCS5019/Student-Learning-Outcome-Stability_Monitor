import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const user = params.get("user");

    if (token && user) {
      // Store OAuth session per-tab by default to avoid auto-login across multiple tabs.
      // (Users can still use "Remember me" on the email/password login.)
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("user", user);
      window.location.href = "/dashboard";
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="app-bg min-h-screen flex items-center justify-center">
      <p>Signing in...</p>
    </div>
  );
};

export default AuthCallback;
