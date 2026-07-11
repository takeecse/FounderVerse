import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaComments,
  FaUserGroup,
} from "react-icons/fa6";
import { getConnections } from "../api/userApi";

function Connections() {
  const [connections, setConnections] =
    useState([]);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await getConnections();
        setConnections(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchConnections();
  }, []);

  return (
    <div className="page-shell page-wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Trusted network</p>
          <h1 className="page-title">
            My Connections
          </h1>
          <p className="page-subtitle">
            Accepted collaborations appear here so every message
            starts from a trusted FounderVerse relationship.
          </p>
        </div>
        <span className="chip chip-mint">
          <FaUserGroup />
          {connections.length} connected
        </span>
      </div>

      {connections.length === 0 ? (
        <section className="glass-panel p-8 text-center">
          <h2 className="text-2xl font-black">
            No connections yet
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-400">
            Browse founders, send collaboration requests, and
            accepted founders will show up here.
          </p>
          <Link
            to="/founders"
            className="btn btn-primary mt-6"
          >
            Browse Founders
            <FaArrowRight />
          </Link>
        </section>
      ) : (
        <section className="card-grid">
          {connections.map((user) => (
            <div
              key={user._id}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-4">
                <img
                  src={
                    user.photoURL ||
                    `https://ui-avatars.com/api/?name=${user.name}`
                  }
                  alt={user.name}
                  className="avatar h-16 w-16"
                />
                <div>
                  <h2 className="text-2xl font-black">
                    {user.name}
                  </h2>
                  <p className="mt-1 text-cyan-200">
                    {user.role || "Founder"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {user.location || "Remote"}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={`/founders/${user._id}`}
                  className="btn btn-secondary"
                >
                  View Profile
                </Link>
                <Link
                  to={`/chat/${user._id}`}
                  className="btn btn-primary"
                >
                  <FaComments />
                  Message
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default Connections;
