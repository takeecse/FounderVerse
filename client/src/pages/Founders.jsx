import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllUsers } from "../api/userApi";

function Founders() {
  const [users, setUsers] = useState([]);
  const [nameSearch, setNameSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");

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

const filteredUsers = users.filter((user) => {
  const matchesName =
    user.name
      .toLowerCase()
      .includes(nameSearch.toLowerCase());

  const matchesSkill =
    skillSearch === ""
      ? true
      : user.skills.some((skill) =>
          skill
            .toLowerCase()
            .includes(skillSearch.toLowerCase())
        );

  return matchesName && matchesSkill;
});

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Browse Founders
      </h1>

      <div className="grid md:grid-cols-2 gap-4 mb-8">

        <input
            type="text"
            placeholder="Search by founder name..."
            value={nameSearch}
            onChange={(e) =>
            setNameSearch(e.target.value)
            }
            className="p-3 rounded-xl bg-[#0B1225]"
        />

        <input
            type="text"
            placeholder="Search by skill..."
            value={skillSearch}
            onChange={(e) =>
            setSkillSearch(e.target.value)
            }
            className="p-3 rounded-xl bg-[#0B1225]"
        />

        </div>

      <div className="grid gap-6">

        {filteredUsers.map((user) => (
            <Link
                key={user._id}
                to={`/founders/${user._id}`}
                className="bg-[#0B1225] p-6 rounded-2xl block hover:bg-[#111A35] transition"
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

          </Link>
        ))}

      </div>

    </div>
  );
}

export default Founders;