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

        {requests.map((request) => (
          <div
            key={request._id}
            className="bg-[#0B1225] p-6 rounded-2xl"
          >
            <p className="font-bold">
              {request.receiver.name}
            </p>

            <p className="text-gray-400">
              {request.receiver.email}
            </p>

            <p className="mt-3">
              Startup: {request.startup.title}
            </p>

            <p className="mt-2">
              {request.message}
            </p>

            <p className="mt-4">
              Status: {request.status}
            </p>
          </div>
        ))}

      </div>

    </div>
  );
}

export default SentRequests;