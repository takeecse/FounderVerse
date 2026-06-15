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
              className="bg-[#0B1225] p-6 rounded-2xl"
            >
              <h2 className="text-2xl font-bold">
                {startup.title}
              </h2>

              <p className="text-gray-400 mt-2">
                {startup.tagline}
              </p>

              <p className="mt-4">
                {startup.industry}
              </p>

              <div className="flex gap-3 mt-6">

                <Link
                  to={`/startups/${startup._id}`}
                  className="bg-blue-600 px-4 py-2 rounded-lg"
                >
                  View
                </Link>

                <Link
                  to={`/edit-startup/${startup._id}`}
                  className="bg-yellow-600 px-4 py-2 rounded-lg"
                >
                  Edit
                </Link>

                <button
                  onClick={() =>
                    handleDelete(startup._id)
                  }
                  className="bg-red-600 px-4 py-2 rounded-lg"
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