import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRoleLabel } from "../utils/roles";
import {
  FaCheck,
  FaComments,
  FaHandshake,
  FaXmark,
} from "react-icons/fa6";
import {
  acceptRequest,
  getReceivedRequests,
  rejectRequest,
} from "../api/requestApi";

const statusClass = {
  accepted: "chip chip-mint",
  rejected: "chip chip-rose",
  pending: "chip chip-amber",
};

function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getReceivedRequests();

      if (!Array.isArray(res.data)) {
        throw new Error("The requests response was not a list.");
      }

      setRequests(res.data);
      setLoadError("");
    } catch (error) {
      console.error(error);
      setLoadError(
        error.response?.data?.message ||
          "Could not load your requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (id) => {
    try {
      await acceptRequest(id);
      fetchRequests();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to accept request"
      );
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequest(id);
      fetchRequests();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to reject request"
      );
    }
  };

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Collaboration inbox</p>
          <h1 className="page-title">
            Requests
          </h1>
          <p className="page-subtitle">
            Review collaboration requests and turn accepted
            matches into direct conversations.
          </p>
        </div>
        <span className="chip">
          <FaHandshake />
          {requests.length} total
        </span>
      </div>

      <section className="grid gap-5">
        {loading ? (
          <div className="glass-panel p-8 text-center text-slate-400">
            Loading requests...
          </div>
        ) : loadError ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-rose-200">{loadError}</p>
            <button
              type="button"
              onClick={fetchRequests}
              className="btn btn-secondary mt-4"
            >
              Try again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400">
            No requests yet.
          </div>
        ) : (
          requests.map((request) => {
            const sender = request?.sender;
            const senderId = sender?._id;
            const senderName = sender?.name || "Unavailable founder";
            const isStartupInvite = request?.requestType === "startup_invite";

            return (
              <article
                key={
                  request?._id ||
                  `${senderId || "unknown"}-${request?.createdAt || "request"}`
                }
                className="glass-card p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    {sender?.photoURL ? (
                      <img
                        src={sender.photoURL}
                        alt={senderName}
                        className="avatar h-16 w-16"
                      />
                    ) : (
                      <div className="avatar flex h-16 w-16 items-center justify-center text-xl font-bold">
                        {senderName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-black">
                        {senderName}
                      </h2>
                      {sender?.username && (
                        <p className="mt-1 text-sm font-semibold text-cyan-200">@{sender.username}</p>
                      )}
                      {sender ? (
                        <>
                          <p className="mt-1 text-cyan-200">
                            {getRoleLabel(sender)}
                          </p>
                          {sender.email && (
                            <p className="mt-1 text-sm text-slate-400">
                              {sender.email}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">
                          This account is no longer available.
                        </p>
                      )}
                      {request?.startup?.title && (
                        <p className="mt-3 text-sm text-amber-200">
                          {isStartupInvite ? "Invitation to join" : "Startup request:"} {request.startup.title}
                        </p>
                      )}
                      {isStartupInvite && (
                        <p className="mt-1 text-sm font-bold text-emerald-200">Invited role: {request.startupRole || "Member"}</p>
                      )}
                    </div>
                  </div>

                  <span
                    className={
                      statusClass[request?.status] || "chip"
                    }
                  >
                    {request?.status || "unknown"}
                  </span>
                </div>

                <p className="mt-5 leading-7 text-slate-300">
                  {request?.message || "Let's collaborate."}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {senderId && (
                    <Link
                      to={`/founders/${senderId}`}
                      className="btn btn-secondary"
                    >
                      View Profile
                    </Link>
                  )}

                  {request?.startup?._id && (
                    <Link to={`/startups/${request.startup._id}`} className="btn btn-secondary">
                      Open startup
                    </Link>
                  )}

                  {request?.status === "accepted" && senderId && !isStartupInvite && (
                    <Link
                      to={`/chat/${senderId}`}
                      className="btn btn-primary"
                    >
                      <FaComments />
                      Message
                    </Link>
                  )}

                  {request?._id && request.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAccept(request._id)}
                        className="btn btn-success"
                      >
                        <FaCheck />
                        {isStartupInvite ? "Join startup" : "Accept"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(request._id)}
                        className="btn btn-danger"
                      >
                        <FaXmark />
                        {isStartupInvite ? "Decline" : "Reject"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

export default Requests;
