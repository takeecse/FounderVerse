import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecommendedStartups } from "../api/startupApi";

function RecommendedStartups() {
  const [startups, setStartups] = useState([]);
  const [hasProfileData, setHasProfileData] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommended = async () => {
      try {
        const res = await getRecommendedStartups();

        setStartups(res.data.startups);
        setHasProfileData(res.data.hasProfileData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommended();
  }, []);

  return (
    <section className="glass-panel mt-6 p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Based on your profile</p>
          <h2 className="text-2xl font-black">Recommended for you</h2>
        </div>
        <Link to="/startups" className="btn btn-secondary">
          Browse all
        </Link>
      </div>

      {loading && <p className="text-slate-400">Finding matches...</p>}

      {!loading && !hasProfileData && (
        <p className="text-slate-400">
          Add your skills and interests to your profile to get
          recommendations.{" "}
          <Link to="/edit-profile" className="text-cyan-200 underline">
            Edit profile
          </Link>
        </p>
      )}

      {!loading && hasProfileData && startups.length === 0 && (
        <p className="text-slate-400">
          No matching startups yet. Try adding more skills or interests.
        </p>
      )}

      {startups.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {startups.slice(0, 3).map((startup) => (
            <Link
              key={startup._id}
              to={`/startups/${startup._id}`}
              className="glass-card p-5"
            >
              <h3 className="text-xl font-black">{startup.title}</h3>
              <p className="mt-2 line-clamp-2 text-cyan-200">
                {startup.tagline}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {startup.industry && (
                  <span className="chip chip-amber">{startup.industry}</span>
                )}
                {startup.matchedTerms?.map((term) => (
                  <span key={term} className="chip chip-mint">
                    {term}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecommendedStartups;
