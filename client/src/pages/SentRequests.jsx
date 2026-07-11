import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaComments,
  FaPaperPlane,
} from "react-icons/fa6";
import { getSentRequests } from "../api/requestApi";

const statusClass = {
  accepted: "chip chip-mint",
  rejected: "chip chip-rose",
  pending: "chip chip-amber",
};

function SentRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await getSentRequests();
        setRequests(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Outbox</p>
          <h1 className="page-title">
            Sent Requests
          </h1>
          <p className="page-subtitle">
            Track your collaboration outreach and jump into chat
            once a founder accepts.
          </p>
        </div>
        <span className="chip">
          <FaPaperPlane />
          {requests.length} sent
        </span>
      </div>

      <section className="grid gap-5">
        {requests.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400">
            No requests sent yet.
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
                      request.receiver.photoURL ||
                      `https://ui-avatars.com/api/?name=${request.receiver.name}`
                    }
                    alt={request.receiver.name}
                    className="avatar h-16 w-16"
                  />
                  <div>
                    <h2 className="text-2xl font-black">
                      {request.receiver.name}
                    </h2>
                    <p className="mt-1 text-cyan-200">
                      {request.receiver.role || "Founder"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {request.receiver.email}
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
                  to={`/founders/${request.receiver._id}`}
                  className="btn btn-secondary"
                >
                  View Profile
                </Link>

                {request.status === "accepted" && (
                  <Link
                    to={`/chat/${request.receiver._id}`}
                    className="btn btn-primary"
                  >
                    <FaComments />
                    Message
                  </Link>
                )}
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default SentRequests;
