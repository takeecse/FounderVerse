import { useEffect, useState } from "react";
import { sendRequest } from "../api/requestApi";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import {
  getStartupById,
  removeTeamMember,
} from "../api/startupApi";

function StartupDetails() {
  const { id } = useParams();

  const [startup, setStartup] = useState(null);

  const [requestMessage, setRequestMessage] =
    useState("");

  const [sending, setSending] =
    useState(false);

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await getStartupById(id);
        setStartup(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStartup();
  }, [id]);

  const handleRemoveMember = async (
    memberId
  ) => {
    const confirmRemove =
      window.confirm(
        "Remove this team member?"
      );

    if (!confirmRemove) return;

    try {
      await removeTeamMember(
        startup._id,
        memberId
      );

      setStartup({
        ...startup,
        teamMembers:
          startup.teamMembers.filter(
            (member) =>
              member._id !== memberId
          ),
      });

    } catch (error) {
      console.error(error);
    }
  };

  const handleSendRequest = async () => {

  if (!requestMessage.trim()) {
    alert("Please write a message");
    return;
  }

  try {

    setSending(true);

    await sendRequest(
      startup.founder._id,
      startup._id,
      requestMessage
    );

    alert("Request sent successfully");

    setRequestMessage("");

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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold">
        {startup.title}
      </h1>

      <div className="flex gap-6 mt-4 text-gray-400">

        <span>
          Team:
          {" "}
          {startup.teamMembers.length + 1}
        </span>

        <span>
          Looking For:
          {" "}
          {startup.lookingFor.length}
        </span>

      </div>

      <p className="text-xl text-gray-400 mt-3">
        {startup.tagline}
      </p>

      <div className="bg-[#0B1225] p-8 rounded-2xl mt-8">

        <p>
          <strong>Description:</strong>
        </p>

        <p className="mt-2">
          {startup.description}
        </p>

        <div className="mt-6">
          <strong>Industry:</strong>
          {" "}
          {startup.industry}
        </div>

        <div className="mt-4">
          <strong>Tech Stack:</strong>
          {" "}
          {startup.techStack.join(", ")}
        </div>

        <div className="mt-4">
          <strong>Looking For:</strong>
          {" "}
          <div className="flex flex-wrap gap-2 mt-3">

            {startup.lookingFor.map((item) => (
              <span
                key={item}
                className="
      bg-cyan-500/20
      text-cyan-400
      px-3
      py-1
      rounded-full
      "
              >
                {item}
              </span>
            ))}

          </div>
        </div>

      </div>

      <div className="bg-[#0B1225] p-8 rounded-2xl mt-8">

  <h2 className="text-3xl font-bold">
    Join This Startup
  </h2>

  <p className="text-gray-400 mt-2">
    Send a request to become a team member.
  </p>

  <textarea
    value={requestMessage}
    onChange={(e) =>
      setRequestMessage(e.target.value)
    }
    placeholder="Tell the founder what you can contribute..."
    className="
    w-full
    mt-5
    p-4
    rounded-xl
    bg-gray-800
    min-h-[120px]
    "
  />

  <button
    onClick={handleSendRequest}
    disabled={sending}
    className="
    mt-4
    bg-cyan-500
    px-6
    py-3
    rounded-xl
    font-semibold
    "
  >
    {sending
      ? "Sending..."
      : "Send Request"}
  </button>

</div>

      <div className="bg-[#0B1225] p-8 rounded-2xl mt-8">

        <h2 className="text-3xl font-bold mb-4">
          Founder
        </h2>

        <div className="flex items-center gap-4">
          <img
            src={
              startup.founder.photoURL ||
              `https://ui-avatars.com/api/?name=${startup.founder.name}`
            }
            alt=""
            className="w-16 h-16 rounded-full"
          />

          <div>
            <h3 className="text-xl font-bold">
              {startup.founder.name}
            </h3>

            <p className="text-gray-400">
              {startup.founder.email}
            </p>
            <Link
              to={`/chat/${startup.founder._id}`}
              className="
  inline-block
  mt-5
  bg-cyan-500
  px-6
  py-3
  rounded-xl
  font-semibold
  "
            >
              Message Founder
            </Link>
          </div>
        </div>

      </div>

      <div className="bg-[#0B1225] p-8 rounded-2xl mt-8">

        <h2 className="text-3xl font-bold mb-4">
          Team Members
        </h2>

        {startup.teamMembers.length === 0 ? (
          <p className="text-gray-400">
            No team members yet
          </p>
        ) : (
          startup.teamMembers.map((member) => (
            <div
              key={member._id}
              className="mb-4 border-b border-gray-700 pb-4"
            >
              <p className="font-bold">
                {member.name}
              </p>

              <p className="text-gray-400">
                {member.email}
              </p>

              <button
                onClick={() =>
                  handleRemoveMember(member._id)
                }
                className="mt-2 bg-red-600 px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))
        )}

      </div>

    </div>
  );
}

export default StartupDetails;