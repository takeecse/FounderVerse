import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaLocationDot,
  FaMagnifyingGlass,
  FaStar,
} from "react-icons/fa6";
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

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesName = user.name
          ?.toLowerCase()
          .includes(nameSearch.toLowerCase());

        const matchesSkill =
          !skillSearch ||
          user.skills?.some((skill) =>
            skill
              .toLowerCase()
              .includes(skillSearch.toLowerCase())
          );

        return matchesName && matchesSkill;
      }),
    [users, nameSearch, skillSearch]
  );

  return (
    <div className="page-shell page-wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Founder discovery</p>
          <h1 className="page-title">
            Discover Founders
          </h1>
          <p className="page-subtitle">
            Search for builders by name, role, skills, and
            startup intent.
          </p>
        </div>
        <span className="chip chip-mint">
          {filteredUsers.length} profiles
        </span>
      </div>

      <section className="glass-panel mb-8 grid gap-4 p-4 md:grid-cols-2">
        <label className="relative">
          <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search founder..."
            value={nameSearch}
            onChange={(e) =>
              setNameSearch(e.target.value)
            }
            className="field pl-11"
          />
        </label>

        <label className="relative">
          <FaMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search skill..."
            value={skillSearch}
            onChange={(e) =>
              setSkillSearch(e.target.value)
            }
            className="field pl-11"
          />
        </label>
      </section>

      <section className="card-grid">
        {filteredUsers.map((user) => (
          <Link
            key={user._id}
            to={`/founders/${user._id}`}
            className="glass-card p-6"
          >
            <div className="flex items-start gap-4">
              <img
                src={
                  user.photoURL ||
                  `https://ui-avatars.com/api/?name=${user.name}`
                }
                alt={user.name}
                className="avatar h-16 w-16"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-2xl font-black">
                  {user.name}
                </h2>
                <p className="mt-1 text-cyan-200">
                  {user.role || "Founder"}
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <FaLocationDot />
                  {user.location || "Remote"}
                </p>
              </div>
            </div>

            <p className="mt-5 line-clamp-3 min-h-[72px] text-sm leading-6 text-slate-400">
              {user.bio || "No bio added yet."}
            </p>

            <div className="mt-5 flex min-h-[68px] flex-wrap content-start gap-2">
              {user.skills?.slice(0, 4).map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
              <span className="flex items-center gap-2 text-sm font-bold text-amber-200">
                <FaStar />
                {user.executionScore || 0}
              </span>
              <span className="flex items-center gap-2 text-sm font-bold text-cyan-200">
                View
                <FaArrowRight />
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

export default Founders;
