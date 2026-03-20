import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import QuickNotesWidget from "./QuickNotesWidget";
import useAuth from "../hooks/useAuth";

const mobileLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/students", label: "Students" },
  { to: "/subjects", label: "Subjects" },
  { to: "/marks", label: "Marks" },
  { to: "/attendance", label: "Attendance" },
  { to: "/note-history", label: "Feedback" },
  { to: "/reports", label: "Reports" }
];

const NavIcon = ({ to, className = "h-4 w-4" }) => {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", viewBox: "0 0 24 24" };

  if (to === "/dashboard") {
    return <svg {...common}><path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 11h8V3h-8zM3 21h8v-6H3z" /></svg>;
  }
  if (to === "/students") {
    return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="3" /><path d="M20 8v6M23 11h-6" /></svg>;
  }
  if (to === "/subjects") {
    return <svg {...common}><path d="M3 6l9-4 9 4-9 4-9-4z" /><path d="M3 6v8l9 4 9-4V6" /></svg>;
  }
  if (to === "/marks") {
    return <svg {...common}><path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" /></svg>;
  }
  if (to === "/attendance") {
    return <svg {...common}><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="6" width="18" height="15" rx="2" /><path d="M9 15l2 2 4-4" /></svg>;
  }
  if (to === "/note-history") {
    return <svg {...common}><path d="M5 3h11l3 3v15H5z" /><path d="M16 3v4h4" /><path d="M8 11h8M8 15h8" /></svg>;
  }
  return <svg {...common}><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
};

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = mobileLinks.filter((link) => {
    if (user?.role === "Student" && link.to === "/students") return false;
    return true;
  });

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
            <span className="inline-flex items-center gap-2">
              <NavIcon to={link.to} />
              <span>{link.label}</span>
            </span>
          </NavLink>
        ))}
        </section>
      </div>
    </div>
  );
};

const AppLayout = ({ children, title }) => {
  const { user } = useAuth();

  return (
    <div className="app-bg min-h-screen ambient-bg">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen px-6 py-8 page-animate">
          <Topbar title={title} />
          <MobileNav />
          <div className="mt-6">{children}</div>
        </div>
      </div>
      {user ? <QuickNotesWidget user={user} /> : null}
    </div>
  );
};

export default AppLayout;
