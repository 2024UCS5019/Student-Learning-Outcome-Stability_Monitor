import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/students", label: "Students" },
  { to: "/subjects", label: "Subjects" },
  { to: "/marks", label: "Marks" },
  { to: "/attendance", label: "Attendance" },
  { to: "/note-history", label: "Feedback" },
  { to: "/notes-history", label: "Notes History" },
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
  if (to === "/notes-history") {
    return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6" /></svg>;
  }
  return <svg {...common}><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
};

const Sidebar = () => {
  const { user } = useAuth();
  const displayName = user?.name || user?.username || "User";
  const displayRole = user?.role || "Viewer";

  return (
    <aside className="hidden lg:flex lg:flex-col w-72 p-4 min-h-screen">
      <div className="card-panel p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl">
        <h1 className="font-display text-2xl font-bold text-ink">Outcome Monitor</h1>
        <p className="muted text-sm mt-1">Stability Intelligence</p>
      </div>

      <nav className="mt-6 flex flex-col gap-2">
        <SidebarLinks />
      </nav>

      <div className="mt-5">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
          <p className="text-slate-500 text-sm">Signed in as</p>
          <p className="mt-1 text-ink text-base font-semibold leading-tight break-words">{displayName}</p>
          <p className="mt-1 text-slate-500 text-sm tracking-wide uppercase">{displayRole}</p>
        </div>
      </div>
    </aside>
  );
};

const SidebarLinks = () => {
  const { user } = useAuth();
  const visibleLinks = links.filter((link) => {
    if (user?.role === "Student" && link.to === "/students") return false;
    return true;
  });

  return visibleLinks.map((link, index) => (
    <NavLink
      key={`${link.to}-${index}`}
      to={link.to}
      className={({ isActive }) =>
        `px-4 py-3 rounded-xl font-medium flex items-center gap-2 transition duration-200 ${
          isActive
            ? "bg-ink text-white shadow-sm"
            : "text-slate-700 hover:bg-slate-100 hover:translate-x-1"
        }`
      }
    >
      <NavIcon to={link.to} />
      {link.label}
    </NavLink>
  ));
};

export default Sidebar;
