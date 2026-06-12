import { useEffect, useState } from "react";
import { getAllUsers } from "../api/userApi";

function Founders() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        setUsers(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Browse Founders
      </h1>

      <div className="grid gap-6">

        {users.map((user) => (
          <div
            key={user._id}
            className="bg-[#0B1225] p-6 rounded-2xl"
          >
            <h2 className="text-2xl font-bold">
              {user.name}
            </h2>

            <p className="text-gray-400 mt-2">
              {user.bio || "No bio"}
            </p>

            <p className="mt-4">
              Skills:
              {" "}
              {user.skills.length > 0
                ? user.skills.join(", ")
                : "None"}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}

export default Founders;