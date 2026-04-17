import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import useAuth from "../hooks/useAuth";
import api from "../services/api";
import { emitToast } from "../utils/toast";

const UserApprovals = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/auth/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
      setError(err?.response?.data?.message || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pendingUsers = useMemo(
    () => users.filter((u) => u?.role !== "Admin" && u?.isApproved === false),
    [users]
  );

  const approvedUsers = useMemo(() => {
    const list = users.filter((u) => u?.role !== "Admin" && u?.isApproved === true && u?.role === "Viewer");
    return list.sort((a, b) => {
      const aTime = new Date(a?.approvedAt || a?.updatedAt || 0).getTime();
      const bTime = new Date(b?.approvedAt || b?.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [users]);

  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 5;
  const historyTotalPages = Math.ceil(approvedUsers.length / historyPageSize);
  const pagedApprovedUsers = approvedUsers.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  const approve = async (id) => {
    setError("");
    try {
      await api.patch(`/auth/users/${id}/approve`);
      emitToast({ type: "success", title: "Approved", message: "User approved successfully." });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to approve user");
    }
  };

  if (user?.role !== "Admin") {
    return (
      <AppLayout title="Approvals">
        <div className="card-panel p-6">
          <p className="text-slate-700">Only Admin can view this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Approvals">
      <div className="card-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Pending Approvals</h2>
            <p className="mt-1 text-sm text-slate-600">
              {pendingUsers.length} account{pendingUsers.length === 1 ? "" : "s"} waiting for approval
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="btn-press inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={loading}
            aria-busy={loading}
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 12a8 8 0 1 1-2.34-5.66"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M20 4v6h-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading users...</p>
        ) : pendingUsers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No pending users.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-slate-800">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{u.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{u.role || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => approve(u._id)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-black text-white hover:bg-slate-900 disabled:opacity-60"
                        disabled={loading}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 card-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Approval History</h2>
            <p className="mt-1 text-sm text-slate-600">
              {approvedUsers.length} approved account{approvedUsers.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading history...</p>
        ) : approvedUsers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No approved users yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pagedApprovedUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-slate-800">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{u.email || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{u.role || "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {u.approvedAt ? new Date(u.approvedAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {u.approvedBy?.name || u.approvedBy?.email || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-slate-500">Page {historyPage} of {historyTotalPages} ({approvedUsers.length} total)</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage === historyTotalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UserApprovals;
