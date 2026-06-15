import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStartups } from "../api/startupApi";

function Startups() {
  const [startups, setStartups] = useState([]);
  const [titleSearch, setTitleSearch] = useState("");
  const [industrySearch, setIndustrySearch] = useState("");
  const [techSearch, setTechSearch] = useState("");

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

  const filteredStartups = startups.filter(
    (startup) => {

      const matchesTitle =
        startup.title
          .toLowerCase()
          .includes(
            titleSearch.toLowerCase()
          );

      const matchesIndustry =
        industrySearch === ""
          ? true
          : startup.industry
            .toLowerCase()
            .includes(
              industrySearch.toLowerCase()
            );

      const matchesTech =
        techSearch === ""
          ? true
          : startup.techStack.some((tech) =>
            tech
              .toLowerCase()
              .includes(
                techSearch.toLowerCase()
              )
          );

      return (
        matchesTitle &&
        matchesIndustry &&
        matchesTech
      );
    }
  );

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Browse Startups
      </h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">

        <input
          type="text"
          placeholder="Search startup..."
          value={titleSearch}
          onChange={(e) =>
            setTitleSearch(e.target.value)
          }
          className="p-3 rounded-xl bg-[#0B1225]"
        />

        <input
          type="text"
          placeholder="Industry..."
          value={industrySearch}
          onChange={(e) =>
            setIndustrySearch(e.target.value)
          }
          className="p-3 rounded-xl bg-[#0B1225]"
        />

        <input
          type="text"
          placeholder="Tech Stack..."
          value={techSearch}
          onChange={(e) =>
            setTechSearch(e.target.value)
          }
          className="p-3 rounded-xl bg-[#0B1225]"
        />

      </div>

      <div className="grid gap-6">

        {filteredStartups.map((startup) => (
          <Link
            key={startup._id}
            to={`/startups/${startup._id}`}
            className="bg-[#0B1225] p-6 rounded-2xl block hover:bg-[#111A35] transition"
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
          </Link>
        ))}

      </div>

    </div>
  );
}

export default Startups;