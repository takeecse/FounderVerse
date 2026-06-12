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
      const res = await getReceivedRequests();
      setRequests(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    await acceptRequest(id);
    fetchRequests();
  };

  const handleReject = async (id) => {
    await rejectRequest(id);
    fetchRequests();
  };

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Requests
      </h1>

      <div className="space-y-6">

        {requests.map((request) => (
          <div
            key={request._id}
            className="bg-[#0B1225] p-6 rounded-2xl"
          >
            <h2 className="text-2xl font-bold">
              {request.sender.name}
            </h2>

            <p className="text-gray-400 mt-2">
              {request.sender.email}
            </p>

            <p className="mt-4">
              Startup:
              {" "}
              {request.startup.title}
            </p>

            <p className="mt-2">
              {request.message}
            </p>

            <p className="mt-4">
              Status:
              {" "}
              {request.status}
            </p>

            {request.status === "pending" && (
              <div className="flex gap-4 mt-6">

                <button
                  onClick={() =>
                    handleAccept(request._id)
                  }
                  className="bg-green-500 px-4 py-2 rounded"
                >
                  Accept
                </button>

                <button
                  onClick={() =>
                    handleReject(request._id)
                  }
                  className="bg-red-500 px-4 py-2 rounded"
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