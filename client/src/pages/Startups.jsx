import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaMagnifyingGlass,
  FaMoneyBillTrendUp,
  FaUsers,
} from "react-icons/fa6";
import { getStartups } from "../api/startupApi";

function Startups() {
  const [startups, setStartups] = useState([]);
  const [titleSearch, setTitleSearch] = useState("");
  const [industrySearch, setIndustrySearch] =
    useState("");
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

  const filteredStartups = useMemo(
    () =>
      startups.filter((startup) => {
        const matchesTitle = startup.title
          ?.toLowerCase()
          .includes(titleSearch.toLowerCase());

        const matchesIndustry =
          !industrySearch ||
          startup.industry
            ?.toLowerCase()
            .includes(industrySearch.toLowerCase());

        const matchesTech =
          !techSearch ||
          startup.techStack?.some((tech) =>
            tech
              .toLowerCase()
              .includes(techSearch.toLowerCase())
          );

        return (
          matchesTitle && matchesIndustry && matchesTech
        );
      }),
    [startups, titleSearch, industrySearch, techSearch]
  );

  return (
    <div className="page-shell page-wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Startup discovery</p>
          <h1 className="page-title">
            Browse Startups
          </h1>
          <p className="page-subtitle">
            Find ventures by market, stage, tech stack, and
            collaboration needs.
          </p>
        </div>
        <span className="chip chip-mint">
          {filteredStartups.length} startups
        </span>
      </div>

      <section className="glass-panel mb-8 grid gap-4 p-4 md:grid-cols-3">
        {[
          {
            value: titleSearch,
            setValue: setTitleSearch,
            placeholder: "Search startup...",
          },
          {
            value: industrySearch,
            setValue: setIndustrySearch,
            placeholder: "Industry...",
          },
          {
            value: techSearch,
            setValue: setTechSearch,
            placeholder: "Tech stack...",
          },
        ].map((field) => (
          <label
            key={field.placeholder}
            className="relative"
          >
            <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) =>
                field.setValue(e.target.value)
              }
              className="field field-with-icon"
            />
          </label>
        ))}
      </section>

      <section className="grid gap-5">
        {filteredStartups.map((startup) => (
          <Link
            key={startup._id}
            to={`/startups/${startup._id}`}
            className="glass-card p-6"
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={
                    startup.logo ||
                    `https://ui-avatars.com/api/?name=${startup.title}`
                  }
                  alt={startup.title}
                  className="avatar h-16 w-16"
                />
                <div>
                  <h2 className="text-3xl font-black">
                    {startup.title}
                  </h2>
                  <p className="mt-2 text-cyan-200">
                    {startup.tagline}
                  </p>
                  <p className="mt-4 line-clamp-2 max-w-3xl leading-7 text-slate-400">
                    {startup.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <span className="chip">
                  {startup.stage || "Idea"}
                </span>
                {startup.isHiring && (
                  <span className="chip chip-mint">
                    Hiring
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {startup.industry && (
                <span className="chip chip-amber">
                  {startup.industry}
                </span>
              )}
              {startup.techStack?.slice(0, 5).map((tech) => (
                <span key={tech} className="chip">
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 text-sm text-slate-400">
              <div className="flex flex-wrap gap-4">
                <span>
                  Founder: {startup.founder?.name || "Unknown"}
                </span>
                <span className="flex items-center gap-2">
                  <FaUsers />
                  {startup.teamSize || 1} members
                </span>
                {startup.fundingStatus && (
                  <span className="flex items-center gap-2">
                    <FaMoneyBillTrendUp />
                    {startup.fundingStatus}
                  </span>
                )}
              </div>
              <span className="flex items-center gap-2 font-bold text-cyan-200">
                View startup
                <FaArrowRight />
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default Startups;
