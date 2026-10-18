import { useEffect, useState } from "react";
import { getRoleLabel, normalizeRoles, USER_ROLES } from "../utils/roles";
import { getCurrentUserId } from "../utils/session";
import {
  FaClipboardCheck,
  FaFlag,
  FaGavel,
  FaRocket,
  FaShieldHalved,
  FaUsers,
} from "react-icons/fa6";
import {
  getAdminModerationQueue,
  getAdminOverview,
  getAdminReports,
  getAdminStartups,
  getAdminUsers,
  getAdminVerificationApplications,
  moderateAdminStartup,
  reviewAdminReport,
  reviewVerificationApplication,
  updateAdminUser,
} from "../api/adminApi";

function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [startups, setStartups] = useState([]);
  const [reports, setReports] = useState([]);
  const [moderation, setModeration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [reviewingId, setReviewingId] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [moderatingStartupId, setModeratingStartupId] = useState("");
  const [reviewingReportId, setReviewingReportId] = useState("");
  const [roleSelections, setRoleSelections] = useState({});
  const [userSearch, setUserSearch] = useState("");
  const [startupSearch, setStartupSearch] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const loadAdmin = async () => {
    try {
      setLoading(true);
      const [
        overviewRes,
        verificationRes,
        usersRes,
        startupsRes,
        reportsRes,
        moderationRes,
      ] = await Promise.all([
        getAdminOverview(),
        getAdminVerificationApplications(),
        getAdminUsers(),
        getAdminStartups(),
        getAdminReports(),
        getAdminModerationQueue(),
      ]);

      setOverview(overviewRes.data);
      setApplications(verificationRes.data);
      setUsers(usersRes.data);
      setStartups(startupsRes.data);
      setReports(reportsRes.data);
      setModeration(moderationRes.data);
      setForbidden(false);
    } catch (error) {
      if (error.response?.status === 403) {
        setForbidden(true);
      } else {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  const handleReview = async (
    application,
    status
  ) => {
    const reviewerNote =
      status === "rejected"
        ? window.prompt("Reason for rejection?") || ""
        : "";

    try {
      setReviewingId(application._id);
      await reviewVerificationApplication(application._id, {
        status,
        reviewerNote,
      });
      await loadAdmin();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Review failed"
      );
    } finally {
      setReviewingId("");
    }
  };

  const updateStakeholderRoles = async (user, roles) => {
    try {
      setUpdatingUserId(user._id);
      await updateAdminUser(user._id, { roles });
      await loadAdmin();
    } catch (error) {
      alert(error.response?.data?.message || "Could not update stakeholder roles.");
    } finally {
      setUpdatingUserId("");
    }
  };

  const handleAddRole = (user) => {
    const role = roleSelections[user._id];
    const roles = normalizeRoles(user);

    if (!role || roles.includes(role)) return;
    updateStakeholderRoles(user, [...roles, role]);
  };

  const handleRemoveRole = (user, role) => {
    const roles = normalizeRoles(user).filter((item) => item !== role);

    if (!roles.length) return;
    updateStakeholderRoles(user, roles);
  };

  const handleAccountStatus = async (user) => {
    const accountStatus = user.accountStatus === "suspended"
      ? "active"
      : "suspended";

    if (
      accountStatus === "suspended" &&
      !window.confirm(`Suspend ${user.name || user.email}? They will lose access until reactivated.`)
    ) {
      return;
    }

    try {
      setUpdatingUserId(user._id);
      await updateAdminUser(user._id, { accountStatus });
      await loadAdmin();
    } catch (error) {
      alert(error.response?.data?.message || "Could not update account status.");
    } finally {
      setUpdatingUserId("");
    }
  };

  const handleStartupVisibility = async (startup) => {
    const moderationStatus = startup.moderationStatus === "hidden"
      ? "published"
      : "hidden";

    try {
      setModeratingStartupId(startup._id);
      await moderateAdminStartup(startup._id, moderationStatus);
      await loadAdmin();
    } catch (error) {
      alert(error.response?.data?.message || "Could not update startup visibility.");
    } finally {
      setModeratingStartupId("");
    }
  };

  const handleReportReview = async (report, status) => {
    const resolutionNote = window.prompt(
      status === "resolved" ? "What action was taken? (optional)" : "Why is this report being dismissed? (optional)"
    ) || "";

    try {
      setReviewingReportId(report._id);
      await reviewAdminReport(report._id, { status, resolutionNote });
      await loadAdmin();
    } catch (error) {
      alert(error.response?.data?.message || "Could not review this report.");
    } finally {
      setReviewingReportId("");
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading admin dashboard...
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="page-shell">
        <section className="glass-panel p-8 text-center">
          <FaShieldHalved className="mx-auto text-3xl text-rose-200" />
          <h1 className="mt-4 text-3xl font-black">
            403 Forbidden
          </h1>
          <p className="mt-2 text-slate-400">
            This workspace is restricted to backend-authorized administrators and system operators.
          </p>
        </section>
      </div>
    );
  }

  const statCards = [
    {
      label: "Users",
      value: overview?.userCount || 0,
      icon: <FaUsers />,
    },
    {
      label: "Suspended Accounts",
      value: overview?.suspendedUserCount || 0,
      icon: <FaShieldHalved />,
    },
    {
      label: "Startups",
      value: overview?.startupCount || 0,
      icon: <FaRocket />,
    },
    {
      label: "Hidden Listings",
      value: overview?.hiddenStartupCount || 0,
      icon: <FaGavel />,
    },
    {
      label: "Pending Reports",
      value: overview?.pendingReportCount || 0,
      icon: <FaFlag />,
    },
    {
      label: "Pending Verification",
      value: overview?.pendingVerificationCount || 0,
      icon: <FaClipboardCheck />,
    },
    {
      label: "Rejected Reviews",
      value: overview?.rejectedApplicationCount || 0,
      icon: <FaFlag />,
    },
  ];

  const currentUserId = getCurrentUserId();
  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${getRoleLabel(user)}`
      .toLowerCase()
      .includes(userSearch.trim().toLowerCase())
  );
  const filteredStartups = startups.filter((startup) =>
    `${startup.title} ${startup.founder?.name || ""}`
      .toLowerCase()
      .includes(startupSearch.trim().toLowerCase())
  );
  const orderedReports = [...reports].sort((first, second) => {
    if (first.status === "pending" && second.status !== "pending") return -1;
    if (second.status === "pending" && first.status !== "pending") return 1;
    return new Date(second.createdAt) - new Date(first.createdAt);
  });

  const adminSections = [
  { id: "overview", label: "Overview" },
  { id: "verification", label: "Verification" },
  { id: "users", label: "Users" },
  { id: "startups", label: "Startups" },
  { id: "reports", label: "Reports" },
  { id: "moderation", label: "Moderation" },
];

  return (
    <div className="page-shell page-wide">
      <div className="section-head">
  <div>
    <p className="eyebrow">FounderVerse Administration</p>
    <h1 className="page-title">
      Administration
    </h1>
    <p className="page-subtitle">
      Manage users, verification, startups, reports, and moderation.
    </p>
  </div>
</div>

<nav className="mb-6 flex flex-wrap gap-2">
  {adminSections.map((section) => (
    <button
      key={section.id}
      type="button"
      onClick={() => setActiveSection(section.id)}
      className={`rounded-lg border px-4 py-2 text-sm font-bold transition ${
        activeSection === section.id
          ? "border-cyan-300/60 bg-cyan-300/15 text-white"
          : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
      }`}
    >
      {section.label}
    </button>
  ))}
</nav>

      {activeSection === "overview" && (
  <section className="stat-grid">
    {statCards.map((card) => (
      <div
        key={card.label}
        className="glass-card p-6"
      >
        <div className="mb-4 text-2xl text-cyan-200">
          {card.icon}
        </div>

        <p className="text-sm font-bold text-slate-400">
          {card.label}
        </p>

        <h2 className="mt-2 text-4xl font-black">
          {card.value}
        </h2>
      </div>
    ))}
  </section>
)}

  {activeSection === "verification" && (
    <div className="glass-panel p-6 xl:col-span-2">
      <h2 className="flex items-center gap-2 text-2xl font-black">
        <FaShieldHalved className="text-cyan-200" />
        Verification Review
      </h2>

      <div className="mt-5 grid gap-3">
        {applications.length === 0 ? (
          <p className="text-sm text-slate-400">
            No verification requests yet.
          </p>
        ) : (
          applications.map((application) => (
            <article
              key={application._id}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">
                    {application.user?.name || "User"} ·{" "}
                    {application.role}
                  </h3>

                  <p className="text-sm text-slate-400">
                    {application.user?.email}
                  </p>
                </div>

                <span className="chip">
                  {application.status}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                {application.evidence?.background ||
                  application.evidence?.notes ||
                  "Evidence submitted."}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-400">
                {application.evidence?.organizationName && (
                  <span>
                    Org: {application.evidence.organizationName}
                  </span>
                )}

                {application.evidence?.website && (
                  <span>
                    Site: {application.evidence.website}
                  </span>
                )}

                {application.evidence?.linkedin && (
                  <span>
                    LinkedIn: {application.evidence.linkedin}
                  </span>
                )}
              </div>

              {application.status === "pending" && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleReview(
                        application,
                        "verified"
                      )
                    }
                    disabled={reviewingId === application._id}
                    className="btn btn-success"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleReview(
                        application,
                        "rejected"
                      )
                    }
                    disabled={reviewingId === application._id}
                    className="btn btn-danger"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  )}

  {activeSection === "users" && (
    <section className="glass-panel p-6 xl:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <FaUsers className="text-cyan-200" />
            User Management
          </h2>
          <p className="mt-2 text-sm text-slate-400">Assign stakeholder personas or suspend/reactivate member access.</p>
        </div>
        <label className="block sm:w-72">
          <span className="sr-only">Search members</span>
          <input className="field" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search members" />
        </label>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {filteredUsers.map((user) => (
          <article
            key={user._id}
            className="rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
                <p className="mt-1 text-xs uppercase text-slate-500">
                  {getRoleLabel(user)} · {user.systemRole || "user"}
                </p>
              </div>
              <span className={`chip ${user.accountStatus === "suspended" ? "text-rose-200" : "chip-mint"}`}>
                {user.accountStatus || "active"}
              </span>
            </div>

            {user.systemRole !== "admin" &&
              user.systemRole !== "system" &&
              user._id !== currentUserId && (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {normalizeRoles(user).map((role) => (
                      <span key={role} className="chip inline-flex items-center gap-2">
                        {role}
                        <button
                          type="button"
                          disabled={updatingUserId === user._id || normalizeRoles(user).length <= 1}
                          onClick={() => handleRemoveRole(user, role)}
                          className="font-black text-slate-400 hover:text-white disabled:opacity-40"
                          aria-label={`Remove ${role} role from ${user.name}`}
                          title="Keep at least one stakeholder role"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <select
                      className="select min-w-44 flex-1 px-3"
                      value={roleSelections[user._id] || ""}
                      onChange={(event) => setRoleSelections((current) => ({
                        ...current,
                        [user._id]: event.target.value,
                      }))}
                      aria-label={`Choose a stakeholder role for ${user.name}`}
                    >
                      <option value="">Add stakeholder role</option>
                      {USER_ROLES
                        .filter((role) => !normalizeRoles(user).includes(role))
                        .map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleAddRole(user)}
                      disabled={!roleSelections[user._id] || updatingUserId === user._id}
                      className="btn btn-secondary"
                    >
                      Add role
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccountStatus(user)}
                      disabled={updatingUserId === user._id}
                      className={user.accountStatus === "suspended" ? "btn btn-secondary" : "btn btn-danger"}
                    >
                      {user.accountStatus === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                  </div>
                </>
              )}
          </article>
        ))}
        {filteredUsers.length === 0 && <p className="text-sm text-slate-400">No members match that search.</p>}
      </div>
    </section>
  )}

  {activeSection === "startups" && (
    <section className="glass-panel p-6 xl:col-span-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <FaRocket className="text-cyan-200" />
            Startup Management
          </h2>
          <p className="mt-2 text-sm text-slate-400">Hide or republish any listing in the marketplace.</p>
        </div>
        <label className="block sm:w-72">
          <span className="sr-only">Search startup listings</span>
          <input className="field" value={startupSearch} onChange={(event) => setStartupSearch(event.target.value)} placeholder="Search startup or founder" />
        </label>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {filteredStartups.map((startup) => (
          <div
            key={startup._id}
            className="rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <p className="font-black">
              {startup.title}
            </p>

            <p className="text-sm text-slate-400">
              {startup.founder?.name || "Unknown founder"} · {startup.status} ·{" "}
              {startup.moderationStatus || "published"}
            </p>
            <button
              type="button"
              onClick={() => handleStartupVisibility(startup)}
              disabled={moderatingStartupId === startup._id}
              className={`mt-3 ${startup.moderationStatus === "hidden" ? "btn btn-secondary" : "btn btn-danger"}`}
            >
              {moderatingStartupId === startup._id
                ? "Saving..."
                : startup.moderationStatus === "hidden"
                  ? "Republish listing"
                  : "Hide listing"}
            </button>
          </div>
        ))}
        {filteredStartups.length === 0 && <p className="text-sm text-slate-400">No startups match that search.</p>}
      </div>
    </section>
  )}

{activeSection === "reports" && (
  <section className="mt-6 glass-panel p-6">
    <h2 className="flex items-center gap-2 text-2xl font-black">
      <FaFlag className="text-cyan-200" />
      Reports & Complaints
    </h2>
    <p className="mt-2 text-sm leading-6 text-slate-400">
      Review reports submitted against member profiles and startup listings.
    </p>
    <div className="mt-5 space-y-3">
      {orderedReports.length === 0 ? (
        <p className="text-sm text-slate-400">No reports have been submitted.</p>
      ) : orderedReports.map((report) => (
        <article key={report._id} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-black">
                {report.targetType === "startup" ? "Startup" : "Member"}: {report.targetName}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Reported by {report.reporter?.name || "Unknown member"} · {report.reporter?.email || ""}
              </p>
            </div>
            <span className={`chip ${report.status === "pending" ? "chip-amber" : "chip-mint"}`}>
              {report.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-cyan-100">Reason: {report.reason}</p>
          {report.details && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{report.details}</p>}
          {report.resolutionNote && <p className="mt-2 text-sm text-slate-400">Review note: {report.resolutionNote}</p>}
          {report.status === "pending" && (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleReportReview(report, "resolved")}
                disabled={reviewingReportId === report._id}
                className="btn btn-success"
              >
                {reviewingReportId === report._id ? "Saving..." : "Resolve"}
              </button>
              <button
                type="button"
                onClick={() => handleReportReview(report, "dismissed")}
                disabled={reviewingReportId === report._id}
                className="btn btn-secondary"
              >
                Dismiss
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  </section>
)}

{activeSection === "moderation" && (
  <section className="mt-6 glass-panel p-6">
    <h2 className="flex items-center gap-2 text-2xl font-black">
      <FaGavel className="text-cyan-200" />
      Content Moderation
    </h2>

    <p className="mt-3 text-sm leading-6 text-slate-400">
      Recent moderation queue:{" "}
      {(moderation?.recentUsers?.length || 0) +
        (moderation?.recentStartups?.length || 0)}{" "}
      items.
    </p>
  </section>
)}
    </div>
  );
}

export default AdminDashboard;
