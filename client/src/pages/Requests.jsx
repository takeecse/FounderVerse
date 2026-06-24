import { useEffect, useState } from "react";
import {
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
} from "../api/requestApi";

function Requests() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const res =
        await getReceivedRequests();

      setRequests(res.data);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept =
    async (id) => {
      try {
        await acceptRequest(id);
        fetchRequests();
      } catch (error) {
        console.error(error);
      }
    };

  const handleReject =
    async (id) => {
      try {
        await rejectRequest(id);
        fetchRequests();
      } catch (error) {
        console.error(error);
      }
    };

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Collaboration Requests
      </h1>

      <div className="space-y-6">

        {requests.length === 0 && (
          <div className="bg-[#0B1225] p-8 rounded-2xl">
            No requests yet.
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
                  request.sender.photoURL ||
                  `https://ui-avatars.com/api/?name=${request.sender.name}`
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
                  {request.sender.name}
                </h2>

                <p className="text-cyan-400">
                  {request.sender.role ||
                    "Founder"}
                </p>

                <p className="text-gray-400">
                  {request.sender.email}
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

              <span className="ml-2 text-cyan-400">
                {request.status}
              </span>

            </div>

            {request.status ===
              "pending" && (
              <div className="flex gap-4 mt-6">

                <button
                  onClick={() =>
                    handleAccept(
                      request._id
                    )
                  }
                  className="
                  bg-green-500
                  px-5
                  py-2
                  rounded-xl
                  "
                >
                  Accept
                </button>

                <button
                  onClick={() =>
                    handleReject(
                      request._id
                    )
                  }
                  className="
                  bg-red-500
                  px-5
                  py-2
                  rounded-xl
                  "
                >
                  Reject
                </button>

              </div>
            )}

          </div>
        ))}

      </div>

    </div>
  );
}

export default Requests;