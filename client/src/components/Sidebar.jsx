import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/students", label: "Students" },
  { to: "/subjects", label: "Subjects" },
  { to: "/marks", label: "Marks" },
  { to: "/attendance", label: "Attendance" },
  { to: "/reports", label: "Reports" }
];

const Sidebar = () => (
  <aside className="hidden lg:flex lg:flex-col w-64 p-6">
    <div className="card-panel p-6">
      <h1 className="font-display text-2xl text-ink">Outcome Monitor</h1>
      <p className="muted text-sm mt-1">Stability Intelligence</p>
    </div>
    <nav className="mt-8 flex flex-col gap-2">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `px-4 py-3 rounded-xl font-medium ${
              isActive ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-100"
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
