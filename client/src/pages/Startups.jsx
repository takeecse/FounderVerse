import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaMagnifyingGlass,
  FaMoneyBillTrendUp,
  FaUsers,
} from "react-icons/fa6";
import { getStartups } from "../api/startupApi";

const STAGES = ["Idea", "MVP", "Beta", "Growth", "Scaling"];

function Startups() {
  // Logged-in users see the startups that match their profile first
  const isLoggedIn = Boolean(localStorage.getItem("token"));

  // What the user is typing right now
  const [filters, setFilters] = useState({
    q: "",
    industry: "",
    stage: "",
    hiring: false,
    sort: isLoggedIn ? "relevance" : "newest",
  });

  // The filters we actually send to the server (updated after a short pause)
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [page, setPage] = useState(1);
  const [result, setResult] = useState({
    startups: [],
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const { startups, total, totalPages } = result;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const clearFilters = () => {
    setFilters((prev) => ({
      ...prev,
      q: "",
      industry: "",
      stage: "",
      hiring: false,
    }));
  };

  // Debounce: wait 400ms after the user stops typing, then search.
  // This avoids sending one request for every single letter.
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedFilters(filters);
      setPage(1); // new search always starts from page 1
    }, 400);

    return () => clearTimeout(timer);
  }, [filters]);

  // Ask the server for startups whenever the search or page changes
  useEffect(() => {
    let ignore = false; // ignore old responses if a newer search started

    const fetchStartups = async () => {
      setLoading(true);

      try {
        const res = await getStartups({ ...appliedFilters, page });

        if (!ignore) {
          setResult(res.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchStartups();

    return () => {
      ignore = true;
    };
  }, [appliedFilters, page]);

  const hasFilters =
    filters.q || filters.industry || filters.stage || filters.hiring;

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
          {total} startups
        </span>
      </div>

      <section className="glass-panel mb-8 grid gap-4 p-4 md:grid-cols-4">
        <label className="relative md:col-span-2">
          <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            name="q"
            placeholder="Search name, tech, description..."
            value={filters.q}
            onChange={handleChange}
            className="field field-with-icon"
          />
        </label>

        <input
          type="text"
          name="industry"
          placeholder="Industry..."
          value={filters.industry}
          onChange={handleChange}
          className="field"
        />

        <select
          name="stage"
          value={filters.stage}
          onChange={handleChange}
          className="select"
        >
          <option value="">All stages</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-3 text-slate-300">
          <input
            type="checkbox"
            name="hiring"
            checked={filters.hiring}
            onChange={handleChange}
          />
          Hiring only
        </label>

        {isLoggedIn && (
          <select
            name="sort"
            value={filters.sort}
            onChange={handleChange}
            className="select"
          >
            <option value="relevance">Best match for me</option>
            <option value="newest">Newest first</option>
          </select>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="btn btn-secondary md:col-span-2"
          >
            Clear filters
          </button>
        )}
      </section>

      {loading && (
        <p className="mb-4 text-slate-400">Searching...</p>
      )}

      {!loading && startups.length === 0 && (
        <p className="glass-panel p-6 text-slate-400">
          No startups found. Try a different keyword or clear the filters.
        </p>
      )}

      <section className="grid gap-5">
        {startups.map((startup) => (
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

            {startup.matchedTerms?.length > 0 && (
              <p className="mt-4 text-sm text-emerald-300">
                Matches your profile: {startup.matchedTerms.join(", ")}
              </p>
            )}

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

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <span className="text-slate-400">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default Startups;
