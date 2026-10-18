import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowUpRightFromSquare,
  FaGaugeHigh,
  FaShieldHalved,
  FaUsers,
} from "react-icons/fa6";
import {
  getSystemAccounts,
  getSystemOverview,
  updateSystemOperatorAccess,
} from "../api/systemApi";
import { getCurrentUserId } from "../utils/session";

const formatUptime = (seconds = 0) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return [days ? `${days}d` : "", hours ? `${hours}h` : "", `${minutes}m`]
    .filter(Boolean)
    .join(" ");
};

function SystemDashboard() {
  const [overview, setOverview] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadSystem = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewResponse, accountsResponse] = await Promise.all([
        getSystemOverview(),
        getSystemAccounts(),
      ]);
      setOverview(overviewResponse.data);
      setAccounts(accountsResponse.data);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.status === 403
          ? "This console is reserved for configured system operators."
          : requestError.response?.data?.message || "Could not load system operations."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSystem();
  }, [loadSystem]);

  const handleAccessChange = async (account) => {
    const nextRole = account.systemRole === "admin" ? "user" : "admin";

    try {
      setUpdatingId(account.id);
      await updateSystemOperatorAccess(account.id, nextRole);
      await loadSystem();
    } catch (requestError) {
      alert(requestError.response?.data?.message || "Could not update operator access.");
    } finally {
      setUpdatingId("");
    }
  };

  if (loading && !overview) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading system console...
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="page-shell">
        <section className="glass-panel mx-auto max-w-2xl p-8 text-center">
          <FaShieldHalved className="mx-auto text-3xl text-rose-200" />
          <h1 className="mt-4 text-3xl font-black">System access restricted</h1>
          <p className="mt-3 text-slate-400">{error}</p>
          <Link to="/dashboard" className="btn btn-secondary mt-6">Return to dashboard</Link>
        </section>
      </div>
    );
  }

  const countCards = [
    ["Users", overview?.counts.users, "Total platform accounts"],
    ["Founders", overview?.counts.founders, "Founder profiles"],
    ["Investors", overview?.counts.investors, "Investor profiles"],
    ["Mentors", overview?.counts.mentors, "Mentor profiles"],
    ["Collaborators", overview?.counts.collaborators, "Collaborator profiles"],
    ["Startups", overview?.counts.startups, "Startup listings"],
    ["Needs attention", (overview?.counts.suspendedUsers || 0) + (overview?.counts.hiddenStartups || 0), "Suspended accounts and hidden listings"],
  ];

  const currentUserId = getCurrentUserId();
  const filteredAccounts = accounts.filter((account) =>
    `${account.name} ${account.email} ${account.systemRole}`
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  return (
    <div className="page-shell page-wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Platform operations</p>
          <h1 className="page-title">System console</h1>
          <p className="page-subtitle">
            Monitor service health and manage administrator access. This operator console is assigned through server configuration.
          </p>
        </div>
        <Link to="/admin" className="btn btn-secondary">
          <FaArrowUpRightFromSquare />
          Open admin workspace
        </Link>
      </div>

      <section className="glass-panel mb-6 flex flex-wrap items-center gap-4 p-5">
        <span className={`chip ${overview?.database === "connected" ? "chip-mint" : "text-rose-200"}`}>
          Database {overview?.database || "unknown"}
        </span>
        <span className="chip">API uptime {formatUptime(overview?.uptimeSeconds)}</span>
        <span className="chip">Environment {overview?.environment || "unknown"}</span>
        <span className="chip">Pending requests {overview?.counts.pendingRequests || 0}</span>
        <span className="chip">Pending reports {overview?.counts.pendingReports || 0}</span>
        <span className="chip">Pending verification {overview?.counts.pendingVerifications || 0}</span>
      </section>

      <section className="stat-grid">
        {countCards.map(([label, value, detail]) => (
          <article key={label} className="glass-card p-5">
            <FaGaugeHigh className="mb-4 text-2xl text-cyan-200" />
            <p className="text-sm font-bold text-slate-400">{label}</p>
            <p className="mt-2 text-4xl font-black">{value || 0}</p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </section>

      <section className="glass-panel mt-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Access control</p>
            <h2 className="text-2xl font-black">Administrator accounts</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Grant or revoke human admin access for active accounts. System operator accounts are read-only here and are managed with the server-side SYSTEM_EMAILS setting.
            </p>
          </div>
          <label className="block sm:w-72">
            <span className="sr-only">Search accounts</span>
            <input
              className="field"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email"
            />
          </label>
        </div>

        <div className="mt-5 space-y-3">
          {filteredAccounts.length === 0 ? (
            <p className="text-sm text-slate-400">No accounts match that search.</p>
          ) : filteredAccounts.map((account) => {
            const isSystemOperator = account.systemRole === "system";
            const canManage =
              !isSystemOperator &&
              !account.isConfigured &&
              account.id !== currentUserId &&
              (account.systemRole === "admin" || account.accountStatus !== "suspended");

            return (
              <article
                key={account.id}
                className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-cyan-300/10 text-cyan-100">
                    <FaUsers />
                  </span>
                  <div>
                    <p className="font-black">{account.name || "Unnamed account"}</p>
                    <p className="text-sm text-slate-400">{account.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip">
                    {isSystemOperator ? "System operator" : account.systemRole === "admin" ? "Administrator" : "Member"}
                  </span>
                  {account.isConfigured && <span className="text-xs text-slate-500">Environment managed</span>}
                  {canManage && (
                    <button
                      type="button"
                      disabled={updatingId === account.id}
                      onClick={() => handleAccessChange(account)}
                      className={account.systemRole === "admin" ? "btn btn-danger" : "btn btn-secondary"}
                    >
                      {updatingId === account.id
                        ? "Saving..."
                        : account.systemRole === "admin"
                          ? "Revoke admin"
                          : "Grant admin"}
                    </button>
                  )}
                  {account.id === currentUserId && <span className="text-xs text-slate-500">Current account</span>}
                  {account.accountStatus === "suspended" && <span className="chip text-rose-200">Suspended</span>}
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Showing up to 200 most recently created accounts. Administrator role grants are checked by the server on every request.
        </p>
      </section>
    </div>
  );
}

export default SystemDashboard;
