import { useEffect, useState } from "react";
import { getStartups } from "../api/startupApi";

function Startups() {
  const [startups, setStartups] = useState([]);

  useEffect(() => {
    const fetchStartups = async () => {
      try {
        const res = await getStartups();
        setStartups(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStartups();
  }, []);

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Browse Startups
      </h1>

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
              Founder: {startup.founder?.name}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}

export default Startups;