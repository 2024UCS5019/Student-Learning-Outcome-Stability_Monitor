import useAuth from "../hooks/useAuth";

const Topbar = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="font-display text-3xl text-ink">{title}</h2>
        <p className="muted text-sm">Monitoring student learning stability</p>
      </div>
      <div className="card-panel px-4 py-3 flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="text-xs muted">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="px-3 py-1.5 rounded-lg bg-ink text-white text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Topbar;
