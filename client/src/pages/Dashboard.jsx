import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../api/dashboardApi";
import { getNotifications }
  from "../api/notificationApi";

function Dashboard() {
  const [stats, setStats] = useState({
    startupCount: 0,
    receivedRequests: 0,
    acceptedRequests: 0,
    executionScore: 0,
  });
  const [notifications, setNotifications] =
    useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchNotifications =
      async () => {
        try {
          const res =
            await getNotifications();

          setNotifications(res.data);

        } catch (error) {
          console.error(error);
        }
      };

    fetchNotifications();
  }, []);

  return (
    <div className="min-h-screen p-10">

      {/* Header */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-5xl font-bold">
            Dashboard
          </h1>

          <p className="mt-3 text-gray-400">
            Welcome to FounderVerse 🚀
          </p>
        </div>

        <Link
          to="/notifications"
          className="bg-[#0B1225] px-6 py-3 rounded-xl text-xl hover:bg-[#111A35]"
        >
          🔔
          <span className="ml-2 text-cyan-400">
            {
              notifications.filter(
                (n) => !n.isRead
              ).length
            }
          </span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mt-10">

        <div className="bg-[#0B1225] p-6 rounded-2xl">
          <p className="text-gray-400">
            My Startups
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {stats.startupCount}
          </h2>
        </div>

        <div className="bg-[#0B1225] p-6 rounded-2xl">
          <p className="text-gray-400">
            Requests Received
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {stats.receivedRequests}
          </h2>
        </div>

        <div className="bg-[#0B1225] p-6 rounded-2xl">
          <p className="text-gray-400">
            Accepted Requests
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {stats.acceptedRequests}
          </h2>
        </div>

        <div className="bg-[#0B1225] p-6 rounded-2xl">
          <p className="text-gray-400">
            Execution Score
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {stats.executionScore}
          </h2>
        </div>

      </div>

      {/* Main Actions */}
      <div className="grid md:grid-cols-3 gap-6 mt-10">

        <Link
          to="/create-startup"
          className="bg-[#0B1225] rounded-2xl h-24 flex items-center justify-center hover:bg-[#111A35] transition"
        >
          <h2 className="text-xl font-bold">
            Create Startup
          </h2>
        </Link>

        <Link
          to="/founders"
          className="bg-[#0B1225] rounded-2xl h-24 flex items-center justify-center hover:bg-[#111A35] transition"
        >
          <h2 className="text-xl font-bold">
            Browse Founders
          </h2>
        </Link>

        <Link
          to="/requests"
          className="bg-[#0B1225] rounded-2xl h-24 flex items-center justify-center hover:bg-[#111A35] transition"
        >
          <h2 className="text-xl font-bold">
            Requests
          </h2>
        </Link>

      </div>

      {/* Recent Activity */}
      <div className="bg-[#0B1225] p-6 rounded-2xl mt-10">

        <h2 className="text-3xl font-bold mb-6">
          Recent Activity
        </h2>

        <div className="space-y-3">

          <p>
            🚀 Startup created
          </p>

          <p>
            🤝 Request accepted
          </p>

          <p>
            👥 Team member joined
          </p>

        </div>

      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-6 mt-10">

        <Link
          to="/my-startups"
          className="bg-[#0B1225] rounded-2xl h-24 flex items-center justify-center hover:bg-[#111A35] transition"
        >
          <h2 className="text-2xl font-bold">
            My Startups
          </h2>
        </Link>

        <Link
          to="/sent-requests"
          className="bg-[#0B1225] rounded-2xl h-24 flex items-center justify-center hover:bg-[#111A35] transition"
        >
          <h2 className="text-2xl font-bold">
            Sent Requests
          </h2>
        </Link>

      </div>

    </div>
  );
}

export default Dashboard;