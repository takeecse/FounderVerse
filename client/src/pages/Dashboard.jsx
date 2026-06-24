import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBell,
  FaChartLine,
  FaComments,
  FaHandshake,
  FaLayerGroup,
  FaPlus,
  FaRocket,
  FaUserGroup,
} from "react-icons/fa6";
import { getDashboardStats } from "../api/dashboardApi";
import { getNotifications } from "../api/notificationApi";
import { getProfile } from "../api/userApi";

const statCards = [
  {
    key: "startupCount",
    label: "My Startups",
    icon: <FaRocket />,
    tone: "text-cyan-200",
  },
  {
    key: "receivedRequests",
    label: "Requests Received",
    icon: <FaHandshake />,
    tone: "text-emerald-200",
  },
  {
    key: "acceptedRequests",
    label: "Accepted Requests",
    icon: <FaUserGroup />,
    tone: "text-amber-200",
  },
  {
    key: "executionScore",
    label: "Execution Score",
    icon: <FaChartLine />,
    tone: "text-rose-200",
  },
];

function Dashboard() {
  const [stats, setStats] = useState({
    startupCount: 0,
    receivedRequests: 0,
    acceptedRequests: 0,
    executionScore: 0,
  });
  const [profile, setProfile] = useState(null);
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
            Track your founder profile, requests, connections,
            and startup progress from one polished workspace.
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
                `https://ui-avatars.com/api/?name=${profile?.name || "Founder"}`
              }
              alt={profile?.name || "Founder"}
              className="avatar h-20 w-20"
            />
            <div>
              <h2 className="text-3xl font-black">
                {profile?.name || "Founder"}
              </h2>
              <p className="mt-1 text-slate-400">
                {profile?.role || "Founder"} ·{" "}
                {profile?.location || "Remote"}
              </p>
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
              Complete Profile
            </Link>
            <Link
              to="/create-startup"
              className="btn btn-primary"
            >
              <FaPlus />
              New Startup
            </Link>
          </div>
        </div>
      </section>

      <section className="stat-grid mt-6">
        {statCards.map((card) => (
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
            <h2 className="text-2xl font-black">
              Fast Actions
            </h2>
            <FaLayerGroup className="text-cyan-200" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/my-startups"
              className="glass-card p-5"
            >
              <FaRocket className="mb-4 text-2xl text-cyan-200" />
              <h3 className="text-xl font-black">
                Manage Startups
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Review your ventures, edit details, and manage
                members.
              </p>
            </Link>
            <Link
              to="/founders"
              className="glass-card p-5"
            >
              <FaUserGroup className="mb-4 text-2xl text-emerald-200" />
              <h3 className="text-xl font-black">
                Browse Founders
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                Find builders by profile, skills, interests, and
                fit.
              </p>
            </Link>
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
