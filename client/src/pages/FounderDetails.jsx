import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUserById } from "../api/userApi";

function FounderDetails() {
  const { id } = useParams();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserById(id);
        setUser(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUser();
  }, [id]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold">
        {user.name}
      </h1>

      <p className="text-gray-400 mt-4">
        {user.bio || "No bio available"}
      </p>

      <div className="bg-[#0B1225] p-8 rounded-2xl mt-8">

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p className="mt-4">
          <strong>Skills:</strong>{" "}
          {user.skills.length > 0
            ? user.skills.join(", ")
            : "None"}
        </p>

        <p className="mt-4">
          <strong>GitHub:</strong>{" "}
          {user.github || "Not added"}
        </p>

        <p className="mt-4">
          <strong>LinkedIn:</strong>{" "}
          {user.linkedin || "Not added"}
        </p>

      </div>

    </div>
  );
}

export default FounderDetails;