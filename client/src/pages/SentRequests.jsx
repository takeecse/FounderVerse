import { useEffect, useState } from "react";
import { getSentRequests } from "../api/requestApi";

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
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Sent Requests
      </h1>

      <div className="grid gap-6">

        {requests.length === 0 && (
          <div className="bg-[#0B1225] p-8 rounded-2xl">
            No requests sent yet.
          </div>
        )}

        {requests.map((request) => (
          <div
            key={request._id}
            className="
            bg-[#0B1225]
            p-6
            rounded-3xl
            border
            border-white/10
            "
          >

            <div className="flex items-center gap-4">

              <img
                src={
                  request.receiver.photoURL ||
                  `https://ui-avatars.com/api/?name=${request.receiver.name}`
                }
                alt=""
                className="
                w-16
                h-16
                rounded-full
                border
                border-cyan-500
                "
              />

              <div>

                <h2 className="text-2xl font-bold">
                  {request.receiver.name}
                </h2>

                <p className="text-cyan-400">
                  {request.receiver.role ||
                    "Founder"}
                </p>

                <p className="text-gray-400">
                  {request.receiver.email}
                </p>

              </div>

            </div>

            <div className="mt-5">

              <p className="text-gray-300">
                {request.message ||
                  "Let's collaborate."}
              </p>

            </div>

            <div className="mt-5">

              <span className="text-gray-400">
                Status:
              </span>

              <span
                className={`ml-2 font-semibold ${
                  request.status === "accepted"
                    ? "text-green-400"
                    : request.status === "rejected"
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}
              >
                {request.status}
              </span>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default SentRequests;