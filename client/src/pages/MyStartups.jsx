import { useEffect, useState } from "react";
import { getMyStartups } from "../api/startupApi";

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

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default MyStartups;