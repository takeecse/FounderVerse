import { useEffect, useState } from "react";
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

  const fetchRequests = async () => {
    try {
      const res = await getReceivedRequests();
      setRequests(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const res = await getReceivedRequests();
        setRequests(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    loadRequests();
  }, []);

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
        {requests.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400">
            No requests yet.
          </div>
        ) : (
          requests.map((request) => (
            <article
              key={request._id}
              className="glass-card p-6"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <img
                    src={
                      request.sender.photoURL ||
                      `https://ui-avatars.com/api/?name=${request.sender.name}`
                    }
                    alt={request.sender.name}
                    className="avatar h-16 w-16"
                  />
                  <div>
                    <h2 className="text-2xl font-black">
                      {request.sender.name}
                    </h2>
                    <p className="mt-1 text-cyan-200">
                      {getRoleLabel(request.sender)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {request.sender.email}
                    </p>
                    {request.startup?.title && (
                      <p className="mt-3 text-sm text-amber-200">
                        Startup: {request.startup.title}
                      </p>
                    )}
                  </div>
                </div>

                <span
                  className={
                    statusClass[request.status] ||
                    "chip"
                  }
                >
                  {request.status}
                </span>
              </div>

              <p className="mt-5 leading-7 text-slate-300">
                {request.message || "Let's collaborate."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/founders/${request.sender._id}`}
                  className="btn btn-secondary"
                >
                  View Profile
                </Link>

                {request.status === "accepted" && (
                  <Link
                    to={`/chat/${request.sender._id}`}
                    className="btn btn-primary"
                  >
                    <FaComments />
                    Message
                  </Link>
                )}

                {request.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        handleAccept(request._id)
                      }
                      className="btn btn-success"
                    >
                      <FaCheck />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleReject(request._id)
                      }
                      className="btn btn-danger"
                    >
                      <FaXmark />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default Requests;
