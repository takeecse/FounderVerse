import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowUpRightFromSquare,
  FaComments,
  FaHandshake,
  FaLocationDot,
  FaPen,
  FaTrash,
  FaUsers,
} from "react-icons/fa6";
import {
  getRequestStatus,
  sendRequest,
} from "../api/requestApi";
import {
  getStartupById,
  removeTeamMember,
} from "../api/startupApi";
import {
  getCurrentUserId,
  isAuthenticated,
} from "../utils/session";
import { normalizeExternalUrl } from "../utils/links";

function StartupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();
  const [startup, setStartup] = useState(null);
  const [requestMessage, setRequestMessage] =
    useState("");
  const [requestStatus, setRequestStatus] =
    useState("none");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await getStartupById(id);
        setStartup(res.data);

        if (
          isAuthenticated() &&
          currentUserId &&
          res.data.founder?._id !== currentUserId
        ) {
          const statusRes = await getRequestStatus(
            res.data.founder._id,
            res.data._id
          );

          setRequestStatus(statusRes.data.status || "none");
        } else {
          setRequestStatus("none");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchStartup();
  }, [id, currentUserId]);

  const isFounder =
    startup?.founder?._id === currentUserId;
  const isStartupMember =
    startup?.teamMembers?.some(
      (member) => (member._id || member) === currentUserId
    ) ||
    requestStatus === "member" ||
    requestStatus === "accepted";
  const hasPendingRequest = requestStatus === "pending";

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this team member?")) {
      return;
    }

    try {
      await removeTeamMember(startup._id, memberId);
      setStartup({
        ...startup,
        teamMembers: startup.teamMembers.filter(
          (member) => member._id !== memberId
        ),
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to remove team member"
      );
    }
  };

  const handleSendRequest = async () => {
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { from: `/startups/${id}` },
      });
      return;
    }

    if (!requestMessage.trim()) {
      alert("Please write a message");
      return;
    }

    try {
      setSending(true);
      await sendRequest(
        startup.founder._id,
        startup._id,
        requestMessage.trim()
      );
      alert("Request sent successfully");
      setRequestMessage("");
      setRequestStatus("pending");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to send request"
      );
    } finally {
      setSending(false);
    }
  };

  if (!startup) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading startup...
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Startup profile</p>
          <h1 className="page-title">
            {startup.title}
          </h1>
          <p className="page-subtitle">
            {startup.tagline}
          </p>
        </div>
        <Link
          to="/startups"
          className="btn btn-secondary"
        >
          <FaArrowLeft />
          Startups
        </Link>
      </div>

      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5">
            <img
              src={
                startup.logo ||
                `https://ui-avatars.com/api/?name=${startup.title}`
              }
              alt={startup.title}
              className="avatar h-20 w-20"
            />
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="chip">
                  {startup.stage || "Idea"}
                </span>
                {startup.isHiring && (
                  <span className="chip chip-mint">
                    Hiring
                  </span>
                )}
                {startup.fundingStatus && (
                  <span className="chip chip-amber">
                    {startup.fundingStatus}
                  </span>
                )}
              </div>
              <p className="mt-5 max-w-3xl leading-7 text-slate-300">
                {startup.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {startup.website && (
              <a
                href={normalizeExternalUrl(startup.website)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <FaArrowUpRightFromSquare />
                Website
              </a>
            )}
            {isFounder ? (
              <Link
                to={`/edit-startup/${startup._id}`}
                className="btn btn-primary"
              >
                <FaPen />
                Edit Startup
              </Link>
            ) : (
              <Link
                to={
                  isAuthenticated()
                    ? `/chat/${startup.founder._id}`
                    : "/login"
                }
                state={
                  isAuthenticated()
                    ? undefined
                    : {
                        from: `/chat/${startup.founder._id}`,
                      }
                }
                className="btn btn-primary"
              >
                <FaComments />
                Message Founder
              </Link>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-white/10 pt-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold text-slate-400">
              Team
            </p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-black">
              <FaUsers className="text-cyan-200" />
              {startup.teamMembers.length + 1}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400">
              Industry
            </p>
            <p className="mt-1 text-2xl font-black">
              {startup.industry || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400">
              Location
            </p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-black">
              <FaLocationDot className="text-emerald-200" />
              {startup.location || "Remote"}
            </p>
          </div>
        </div>
      </section>

      <section className="two-grid mt-6">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-black">
            Tech Stack
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {startup.techStack?.length > 0 ? (
              startup.techStack.map((tech) => (
                <span key={tech} className="chip">
                  {tech}
                </span>
              ))
            ) : (
              <p className="text-slate-400">
                No stack listed.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-black">
            Looking For
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {startup.lookingFor?.length > 0 ? (
              startup.lookingFor.map((item) => (
                <span
                  key={item}
                  className="chip chip-mint"
                >
                  {item}
                </span>
              ))
            ) : (
              <p className="text-slate-400">
                No needs listed.
              </p>
            )}
          </div>
        </div>
      </section>

      {!isFounder && (
        <section className="glass-panel mt-6 p-6">
          <h2 className="text-2xl font-black">
            Join This Startup
          </h2>
          {isStartupMember ? (
            <p className="mt-2 inline-flex rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100">
              Connected / Member
            </p>
          ) : hasPendingRequest ? (
            <p className="mt-2 inline-flex rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100">
              Request pending
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-400">
                Send a direct, specific request to the founder.
              </p>
              <textarea
                value={requestMessage}
                onChange={(e) =>
                  setRequestMessage(e.target.value)
                }
                placeholder="Tell the founder what you can contribute..."
                className="textarea mt-5"
              />
              <button
                type="button"
                onClick={handleSendRequest}
                disabled={sending}
                className="btn btn-primary mt-4"
              >
                <FaHandshake />
                {sending ? "Sending..." : "Send Request"}
              </button>
            </>
          )}
        </section>
      )}

      <section className="two-grid mt-6">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-black">
            Founder
          </h2>
          <div className="mt-5 flex items-center gap-4">
            <img
              src={
                startup.founder.photoURL ||
                `https://ui-avatars.com/api/?name=${startup.founder.name}`
              }
              alt={startup.founder.name}
              className="avatar h-14 w-14"
            />
            <div>
              <Link
                to={`/founders/${startup.founder._id}`}
                className="text-xl font-black hover:text-cyan-200"
              >
                {startup.founder.name}
              </Link>
              <p className="text-sm text-slate-400">
                {startup.founder.email}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-black">
            Team Members
          </h2>
          <div className="mt-5 grid gap-3">
            {startup.teamMembers.length === 0 ? (
              <p className="text-slate-400">
                No team members yet.
              </p>
            ) : (
              startup.teamMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div>
                    <p className="font-black">
                      {member.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {member.email}
                    </p>
                  </div>
                  {isFounder && (
                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveMember(member._id)
                      }
                      className="btn btn-danger icon-btn"
                      title="Remove member"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default StartupDetails;
