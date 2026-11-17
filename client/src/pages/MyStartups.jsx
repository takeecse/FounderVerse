import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCircleCheck,
  FaEye,
  FaPen,
  FaPlus,
  FaTrash,
} from "react-icons/fa6";
import {
  deleteStartup,
  getMyStartups,
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
    window.addEventListener("founderverse:verification-updated", fetchMyStartups);
    return () => window.removeEventListener("founderverse:verification-updated", fetchMyStartups);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this startup?")) {
      return;
    }

    try {
      await deleteStartup(id);
      setStartups(
        startups.filter((startup) => startup._id !== id)
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to delete startup"
      );
    }
  };

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Founder portfolio</p>
          <h1 className="page-title">
            My Startups
          </h1>
          <p className="page-subtitle">
            Manage the ventures connected to your account.
          </p>
        </div>
        <Link
          to="/create-startup"
          className="btn btn-primary"
        >
          <FaPlus />
          New Startup
        </Link>
      </div>

      {startups.length === 0 ? (
        <section className="glass-panel p-8 text-center">
          <h2 className="text-2xl font-black">
            No startups yet
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-400">
            Create your first startup profile and start
            attracting collaborators.
          </p>
        </section>
      ) : (
        <section className="grid gap-5">
          {startups.map((startup) => (
            <article
              key={startup._id}
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
                    <h2 className="flex flex-wrap items-center gap-2 text-3xl font-black">
                      {startup.title}
                      {startup.verificationStatus === "verified" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/30 bg-sky-300/10 px-2 py-1 text-xs font-bold text-sky-100">
                          <FaCircleCheck /> Verified
                        </span>
                      )}
                    </h2>
                    <p className="mt-2 text-cyan-200">
                      {startup.tagline}
                    </p>
                    <p className="mt-3 text-slate-400">
                      {startup.location || "Remote"} ·{" "}
                      {startup.industry || "Industry not set"}
                    </p>
                    {startup.viewerPermissions?.isAdmin && !startup.viewerPermissions?.isFounder && (
                      <span className="chip chip-mint mt-3">Startup admin</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
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

              <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                <Link
                  to={`/startups/${startup._id}`}
                  className="btn btn-secondary"
                >
                  <FaEye />
                  View
                </Link>
                <Link
                  to={`/edit-startup/${startup._id}`}
                  className="btn btn-warning"
                >
                  <FaPen />
                  Edit
                </Link>
                {startup.viewerPermissions?.isFounder && (
                  <>
                    <Link to={`/verification/startup?startupId=${startup._id}`} className="btn btn-secondary">
                      {startup.verificationStatus === "pending" ? "Verification in review" : startup.verificationStatus === "verified" ? "Manage verification" : "Verify startup"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(startup._id)}
                      className="btn btn-danger"
                    >
                      <FaTrash />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default MyStartups;
