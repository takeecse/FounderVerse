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
            className="
    bg-[#0B1225]
    p-6
    rounded-3xl
    block
    hover:bg-[#111A35]
    transition
    border
    border-white/5
    hover:border-cyan-500/40
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

                  <p className="mt-4 text-gray-400 line-clamp-2">
                    {startup.description}
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

            <div className="flex flex-wrap gap-2 mt-4">

              {startup.techStack
                ?.slice(0, 4)
                .map((tech) => (
                  <span
                    key={tech}
                    className="
            bg-purple-500/20
            text-purple-300
            px-3
            py-1
            rounded-full
            text-sm
            "
                  >
                    {tech}
                  </span>
                ))}

            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-400">

              <span>
                Founder: {startup.founder?.name}
              </span>

              {startup.location && (
                <span>
                  📍 {startup.location}
                </span>
              )}

              {startup.teamSize && (
                <span>
                  👥 {startup.teamSize} Members
                </span>
              )}

              {startup.fundingStatus && (
                <span>
                  💰 {startup.fundingStatus}
                </span>
              )}

            </div>

          </Link>
        ))}

      </div>

    </div>
  );
}

export default Startups;