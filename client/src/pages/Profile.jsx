import { useEffect, useState } from "react";
import { getProfile } from "../api/userApi";

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setUser(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfile();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        My Profile
      </h1>

      <div className="bg-[#0B1225] p-8 rounded-2xl max-w-3xl">

        <h2 className="text-3xl font-bold mb-4">
          {user.name}
        </h2>

        <p className="text-gray-400 mb-6">
          {user.bio || "No bio added yet."}
        </p>

        <div className="space-y-4">

          <div>
            <strong>Email:</strong> {user.email}
          </div>

          <div>
            <strong>Skills:</strong>{" "}
            {user.skills.length > 0
              ? user.skills.join(", ")
              : "None"}
          </div>

          <div>
            <strong>GitHub:</strong>{" "}
            {user.github || "Not added"}
          </div>

          <div>
            <strong>LinkedIn:</strong>{" "}
            {user.linkedin || "Not added"}
          </div>

          <div>
            <strong>Execution Score:</strong>{" "}
            {user.executionScore}
          </div>

        </div>

      </div>

    </div>
  );
}

export default Profile;