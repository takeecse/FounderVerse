import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConnections } from "../api/userApi";

function Connections() {
  const [connections, setConnections] =
    useState([]);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res =
          await getConnections();

        setConnections(res.data);

      } catch (error) {
        console.error(error);
      }
    };

    fetchConnections();
  }, []);

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        My Connections
      </h1>

      {connections.length === 0 ? (
        <p>No connections yet.</p>
      ) : (
        <div className="grid gap-6">

          {connections.map((user) => (
            <div
              key={user._id}
              className="bg-[#0B1225] p-6 rounded-2xl"
            >
              <div className="flex items-center gap-4">

                <img
                  src={
                    user.photoURL ||
                    `https://ui-avatars.com/api/?name=${user.name}`
                  }
                  alt=""
                  className="w-14 h-14 rounded-full"
                />

                <div>
                  <h2 className="text-xl font-bold">
                    {user.name}
                  </h2>

                  <p className="text-gray-400">
                    {user.role || "Founder"}
                  </p>
                </div>

              </div>

              <div className="flex gap-3 mt-5">

                <Link
                  to={`/founders/${user._id}`}
                  className="bg-cyan-500 px-4 py-2 rounded-lg"
                >
                  View Profile
                </Link>

                <Link
                  to={`/chat/${user._id}`}
                  className="bg-green-600 px-4 py-2 rounded-lg"
                >
                  Message
                </Link>

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

export default Connections;