import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMyStartups,
  deleteStartup,
} from "../api/startupApi";

function MyStartups() {
  const [startups, setStartups] = useState([]);

  useEffect(() => {
    const fetchMyStartups = async () => {
      try {
        const res = await getMyStartups();
        setStartups(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchMyStartups();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this startup?"
    );

    if (!confirmDelete) return;

    try {
      await deleteStartup(id);

      setStartups(
        startups.filter(
          (startup) => startup._id !== id
        )
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        My Startups
      </h1>

      {startups.length === 0 ? (
        <p>No startups created yet.</p>
      ) : (
        <div className="grid gap-6">

          {startups.map((startup) => (
            <div
              key={startup._id}
              className="
    bg-[#0B1225]
    p-6
    rounded-3xl
    border
    border-white/10
    hover:border-cyan-500/40
    transition
    "
            >
              <div className="flex justify-between items-start">

                <div className="flex items-center gap-4">

                  <img
                    src={
                      startup.logo ||
                      `https://ui-avatars.com/api/?name=${startup.title}`
                    }
                    alt=""
                    className="w-14 h-14 rounded-xl"
                  />

                  <div>
                    <h2 className="text-2xl font-bold">
                      {startup.title}
                    </h2>

                    <p className="text-gray-400">
                      {startup.tagline}
                    </p>
                  </div>

                </div>

                <span
                  className="
        bg-cyan-500/20
        text-cyan-400
        px-3
        py-1
        rounded-full
        text-sm
        "
                >
                  {startup.stage || "Idea"}
                </span>

              </div>

              <div className="flex flex-wrap gap-2 mt-5">

                <span className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                  {startup.industry}
                </span>

                {startup.isHiring && (
                  <span
                    className="
          bg-green-500/20
          text-green-400
          px-3
          py-1
          rounded-full
          text-sm
          "
                  >
                    Hiring
                  </span>
                )}

              </div>

              <div className="mt-5 text-gray-400">
                {startup.location || "Remote"}
              </div>

              <div className="flex gap-3 mt-6">

                <Link
                  to={`/startups/${startup._id}`}
                  className="
        bg-blue-600
        px-4
        py-2
        rounded-xl
        "
                >
                  View
                </Link>

                <Link
                  to={`/edit-startup/${startup._id}`}
                  className="
        bg-yellow-600
        px-4
        py-2
        rounded-xl
        "
                >
                  Edit
                </Link>

                <button
                  onClick={() =>
                    handleDelete(startup._id)
                  }
                  className="
        bg-red-600
        px-4
        py-2
        rounded-xl
        "
                >
                  Delete
                </button>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default MyStartups;