import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getStartupById,
  removeTeamMember,
} from "../api/startupApi";

function StartupDetails() {
  const { id } = useParams();

  const [startup, setStartup] = useState(null);

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
          {startup.lookingFor.join(", ")}
        </div>

      </div>

      <div className="bg-[#0B1225] p-8 rounded-2xl mt-8">

        <h2 className="text-3xl font-bold mb-4">
          Founder
        </h2>

        <p>
          {startup.founder.name}
        </p>

        <p>
          {startup.founder.email}
        </p>

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