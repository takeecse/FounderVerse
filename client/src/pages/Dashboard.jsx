import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaChartLine,
  FaComments,
  FaHandshake,
  FaMagnifyingGlassChart,
  FaLayerGroup,
  FaPlus,
  FaRocket,
  FaShieldHalved,
  FaUserGroup,
} from "react-icons/fa6";
import { getDashboardStats } from "../api/dashboardApi";
import { getNotifications } from "../api/notificationApi";
import { getProfile } from "../api/userApi";
import {
  getPrimaryRole,
  getRoleLabel,
  getVerificationStatus,
  VERIFIABLE_ROLES,
  normalizeRoles,
} from "../utils/roles";

const statCardsByRole = {
  Founder: [
    { key: "startupCount", label: "My Startups", icon: <FaRocket />, tone: "text-cyan-200" },
    { key: "pendingReceivedRequests", label: "New Requests", icon: <FaHandshake />, tone: "text-emerald-200" },
    { key: "acceptedRequests", label: "Accepted Requests", icon: <FaUserGroup />, tone: "text-amber-200" },
    { key: "executionScore", label: "Execution Score", icon: <FaChartLine />, tone: "text-rose-200" },
  ],
  Investor: [
    { key: "fundingOpportunities", label: "Funding Opportunities", icon: <FaMagnifyingGlassChart />, tone: "text-cyan-200" },
    { key: "openStartupsCount", label: "Open Teams", icon: <FaRocket />, tone: "text-emerald-200" },
    { key: "sentRequests", label: "Introductions Sent", icon: <FaHandshake />, tone: "text-amber-200" },
    { key: "acceptedSentRequests", label: "Accepted Introductions", icon: <FaUserGroup />, tone: "text-rose-200" },
  ],
  Mentor: [
    { key: "openStartupsCount", label: "Teams Seeking Help", icon: <FaRocket />, tone: "text-cyan-200" },
    { key: "pendingReceivedRequests", label: "New Requests", icon: <FaHandshake />, tone: "text-emerald-200" },
    { key: "activeConnections", label: "Connections", icon: <FaUserGroup />, tone: "text-amber-200" },
    { key: "acceptedRequests", label: "Accepted Requests", icon: <FaChartLine />, tone: "text-rose-200" },
  ],
  Collaborator: [
    { key: "openStartupsCount", label: "Open Teams", icon: <FaRocket />, tone: "text-cyan-200" },
    { key: "sentRequests", label: "Requests Sent", icon: <FaHandshake />, tone: "text-emerald-200" },
    { key: "activeConnections", label: "Connections", icon: <FaUserGroup />, tone: "text-amber-200" },
    { key: "pendingReceivedRequests", label: "Invitations", icon: <FaComments />, tone: "text-rose-200" },
  ],
};

function Dashboard() {
  const [stats, setStats] = useState({
    startupCount: 0,
    receivedRequests: 0,
    acceptedRequests: 0,
    executionScore: 0,
  });
  const [profile, setProfile] = useState(null);
  const [activeRole, setActiveRole] = useState("");
  const [notifications, setNotifications] =
    useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, profileRes, noteRes] =
          await Promise.all([
            getDashboardStats(),
            getProfile(),
            getNotifications(),
          ]);

        setStats(statsRes.data);
        setProfile(profileRes.data);
        setActiveRole(getPrimaryRole(profileRes.data));
        setNotifications(noteRes.data);
      } catch (error) {
        console.error(error);
      }
    };

    loadDashboard();
  }, []);

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;
  const roles = normalizeRoles(profile);
  const selectedRole =
    activeRole || getPrimaryRole(profile);
  const selectedVerification =
    getVerificationStatus(profile, selectedRole);
  const roleActions = {
    Founder: [
      {
        to: "/my-startups",
        title: "Manage Startups",
        text: "Review ventures, edit details, and manage members.",
        icon: <FaRocket />,
      },
      {
        to: "/founders",
        title: "Find Collaborators",
        text: "Find builders by profile, skills, interests, and fit.",
        icon: <FaUserGroup />,
      },
    ],
    Investor: [
      {
        to: "/startups",
        title: "Discover Startups",
        text: "Browse companies and identify promising opportunities.",
        icon: <FaMagnifyingGlassChart />,
      },
      {
        to: "/verification",
        title: "Investor Verification",
        text: "Submit investment background and company evidence.",
        icon: <FaShieldHalved />,
      },
    ],
    Mentor: [
      {
        to: "/founders",
        title: "Browse Founders",
        text: "Find teams that could benefit from your expertise.",
        icon: <FaUserGroup />,
      },
      {
        to: "/verification",
        title: "Mentor Verification",
        text: "Share your background for admin review.",
        icon: <FaShieldHalved />,
      },
    ],
    Collaborator: [
      {
        to: "/startups",
        title: "Find Teams",
        text: "Explore active teams, open roles, and startup opportunities.",
        icon: <FaUserGroup />,
      },
      {
        to: "/sent-requests",
        title: "Track My Requests",
        text: "Follow the collaboration requests you have sent.",
        icon: <FaHandshake />,
      },
    ],
  };
  const activeRoleActions =
    roleActions[selectedRole] ||
    roleActions.Collaborator;
  const activeStatCards =
    statCardsByRole[selectedRole] || statCardsByRole.Collaborator;
  const roleDescription = {
    Founder: "Build and grow your ventures, then bring the right people onto your team.",
    Investor: "Find promising companies, track funding needs, and start focused conversations.",
    Mentor: "Find founders who can benefit from your experience and practical guidance.",
    Collaborator: "Find teams that match your skills and track your path into a project.",
  }[selectedRole] || "Choose a stakeholder role to open its workspace.";

  return (
    <div className="page-shell page-wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Command center</p>
          <h1 className="page-title">
            Welcome back
            {profile?.name ? (
              <>
                ,{" "}
                <span className="text-gradient">
                  {profile.name}
                </span>
              </>
            ) : (
              ""
            )}
          </h1>
          <p className="page-subtitle">
            {roleDescription}
          </p>
        </div>

        <Link
          to="/notifications"
          className="btn btn-secondary"
        >
          <FaBell />
          {unreadCount} unread
        </Link>
      </div>

      <section className="glass-panel p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <img
              src={
                profile?.photoURL ||
                `https://ui-avatars.com/api/?name=${profile?.name || "Member"}`
              }
              alt={profile?.name || "Member"}
              className="avatar h-20 w-20"
            />
            <div>
              <h2 className="text-3xl font-black">
                {profile?.name || "Member"}
              </h2>
              <p className="mt-1 text-slate-400">
                {getRoleLabel(profile)} ·{" "}
                {profile?.location || "Remote"}
              </p>
              {roles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setActiveRole(role)}
                      className={`chip ${
                        selectedRole === role ? "chip-mint" : ""
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {(profile?.skills || [])
                  .slice(0, 4)
                  .map((skill) => (
                    <span
                      key={skill}
                      className="chip"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/edit-profile"
              className="btn btn-secondary"
            >
              {profile?.profileCompleted ? "Edit Profile" : "Complete Profile"}
            </Link>
            {VERIFIABLE_ROLES.includes(selectedRole) && (
              <Link
                to="/verification"
                className="btn btn-secondary"
              >
                <FaShieldHalved />
                Verify {selectedRole}
              </Link>
            )}
            {selectedRole === "Founder" && (
              <Link
                to="/create-startup"
                className="btn btn-primary"
              >
                <FaPlus />
                {stats.startupCount > 0 ? "New Startup" : "Create Startup"}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="stat-grid mt-6">
        {activeStatCards.map((card) => (
          <div
            key={card.key}
            className="glass-card p-6"
          >
            <div
              className={`mb-5 text-2xl ${card.tone}`}
            >
              {card.icon}
            </div>
            <p className="text-sm font-bold text-slate-400">
              {card.label}
            </p>
            <h2 className="mt-2 text-4xl font-black">
              {stats[card.key] ?? 0}
            </h2>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black">
                {selectedRole} Workspace
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {VERIFIABLE_ROLES.includes(selectedRole) ? (
                  <>
                    Verification status:{" "}
                    <span className="font-black text-cyan-100">
                      {selectedVerification}
                    </span>
                  </>
                ) : "Your stakeholder-specific workspace and next steps."}
              </p>
            </div>
            <FaLayerGroup className="text-cyan-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeRoleActions.map((action) => (
              <Link
                key={action.title}
                to={action.to}
                className="glass-card p-5"
              >
                <span className="mb-4 block text-2xl text-cyan-200">
                  {action.icon}
                </span>
                <h3 className="text-xl font-black">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {action.text}
                </p>
              </Link>
            ))}
            <Link
              to="/requests"
              className="glass-card p-5"
            >
              <FaHandshake className="mb-4 text-2xl text-amber-200" />
              <h3 className="text-xl font-black">
                Collaboration Requests
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Accept or reject incoming requests from founders.
              </p>
            </Link>
            <Link
              to="/connections"
              className="glass-card p-5"
            >
              <FaComments className="mb-4 text-2xl text-rose-200" />
              <h3 className="text-xl font-black">
                Conversations
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Continue conversations with accepted connections.
              </p>
            </Link>
          </div>
        </div>

        <aside className="glass-panel p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black">
              Recent Signals
            </h2>
            <Link
              to="/notifications"
              className="text-sm font-bold text-cyan-200"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 5).length === 0 ? (
              <p className="text-sm text-slate-400">
                No new signals yet.
              </p>
            ) : (
              notifications.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <h3 className="font-black">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

export default Dashboard;
