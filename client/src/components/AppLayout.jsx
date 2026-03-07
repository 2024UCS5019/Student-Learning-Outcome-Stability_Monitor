import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import useAuth from "../hooks/useAuth";

const mobileLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/students", label: "Students" },
  { to: "/subjects", label: "Subjects" },
  { to: "/marks", label: "Marks" },
  { to: "/attendance", label: "Attendance" },
  { to: "/reports", label: "Reports" }
];

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = mobileLinks.filter((link) => !(user?.role === "Student" && link.to === "/students"));

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="lg:hidden mt-4">
      <div className="mobile-event-nav">
        <button
          type="button"
          className="event-wrapper"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M6 6l12 12" />
              <path d="M18 6l-12 12" />
            </svg>
          ) : (
            <div className="bar">
              <span className="bar-list"></span>
              <span className="bar-list"></span>
              <span className="bar-list"></span>
            </div>
          )}
        </button>
        <section className={`menu-container ${menuOpen ? "open" : ""}`}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `menu-list ${isActive ? "menu-list-active" : ""}`}
          >
            {link.label}
          </NavLink>
        ))}
        </section>
      </div>
    </div>
  );
};

const AppLayout = ({ children, title }) => (
  <div className="app-bg min-h-screen">
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen px-6 py-8">
        <Topbar title={title} />
        <MobileNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  </div>
);

export default AppLayout;
