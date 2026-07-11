import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaArrowUpRightFromSquare,
  FaBullseye,
  FaCheck,
  FaGithub,
  FaLinkedin,
  FaLocationDot,
  FaPen,
  FaStar,
} from "react-icons/fa6";
import { getProfile } from "../api/userApi";
import { auth } from "../firebase";
import { normalizeExternalUrl } from "../utils/links";

function Profile() {
  const [user, setUser] = useState(null);
  const [googlePhotoURL, setGooglePhotoURL] = useState(
    auth.currentUser?.photoURL || ""
  );

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setGooglePhotoURL(currentUser?.photoURL || "");
    });

    return unsubscribe;
  }, []);

  if (!user) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading profile...
      </div>
    );
  }

  const links = [
    {
      label: "GitHub",
      value: user.github,
      icon: <FaGithub />,
    },
    {
      label: "LinkedIn",
      value: user.linkedin,
      icon: <FaLinkedin />,
    },
    {
      label: "Portfolio",
      value: user.portfolio,
      icon: <FaArrowUpRightFromSquare />,
    },
  ].filter((link) => link.value);

  const completionItems = [
    user.photoURL || googlePhotoURL,
    user.role,
    user.location,
    user.bio,
    user.skills?.length,
    user.lookingFor?.length,
    links.length,
  ];
  const completedCount = completionItems.filter(Boolean).length;
  const completionPercent = Math.round(
    (completedCount / completionItems.length) * 100
  );

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Founder profile</p>
          <h1 className="page-title">
            My Profile
          </h1>
          <p className="page-subtitle">
            This is the identity other founders use to
            understand your skills, interests, and collaboration
            intent.
          </p>
        </div>
        <Link
          to="/edit-profile"
          className="btn btn-primary"
        >
          <FaPen />
          Edit Profile
        </Link>
      </div>

      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-7 md:flex-row md:items-center">
          <img
            src={
              user.photoURL ||
              googlePhotoURL ||
              `https://ui-avatars.com/api/?name=${user.name}`
            }
            alt={user.name}
            className="avatar h-28 w-28"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-4xl font-black">
                {user.name}
              </h2>
              <span className="chip chip-mint">
                <FaStar />
                Score {user.executionScore}
              </span>
              <span className="chip">
                {completionPercent}% complete
              </span>
            </div>
            <p className="mt-2 text-xl text-cyan-200">
              {user.role || "Founder"}
            </p>
            <p className="mt-2 flex items-center gap-2 text-slate-400">
              <FaLocationDot />
              {user.location || "Location not added"}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-8">
          <h3 className="text-2xl font-black">
            About
          </h3>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            {user.bio || "No bio added yet."}
          </p>
        </div>
      </section>

      <section className="two-grid mt-6">
        <div className="glass-card p-6">
          <h3 className="flex items-center gap-2 text-2xl font-black">
            <FaCheck className="text-emerald-200" />
            Profile Strength
          </h3>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Complete profiles help founders understand your fit
            before they send requests or start a chat.
          </p>
        </div>

        <div className="glass-card p-6">
          <h3 className="flex items-center gap-2 text-2xl font-black">
            <FaBullseye className="text-cyan-200" />
            Collaboration Focus
          </h3>
          <p className="mt-4 leading-7 text-slate-300">
            {user.lookingFor?.length
              ? `Open to collaborating with ${user.lookingFor.join(", ")}.`
              : "Add what kind of people you want to meet so the right founders know when to reach out."}
          </p>
        </div>
      </section>

      <section className="two-grid mt-6">
        <div className="glass-card p-6">
          <h3 className="text-2xl font-black">
            Skills
          </h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {user.skills?.length > 0 ? (
              user.skills.map((skill) => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-slate-400">
                No skills added.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-2xl font-black">
            Interests
          </h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {user.interests?.length > 0 ? (
              user.interests.map((interest) => (
                <span
                  key={interest}
                  className="chip chip-amber"
                >
                  {interest}
                </span>
              ))
            ) : (
              <p className="text-slate-400">
                No interests added.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="two-grid mt-6">
        <div className="glass-card p-6">
          <h3 className="text-2xl font-black">
            Looking For
          </h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {user.lookingFor?.length > 0 ? (
              user.lookingFor.map((item) => (
                <span
                  key={item}
                  className="chip chip-mint"
                >
                  {item}
                </span>
              ))
            ) : (
              <p className="text-slate-400">
                Nothing specified.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-2xl font-black">
            Links
          </h3>
          <div className="mt-5 grid gap-3">
            <p className="text-slate-400">
              {user.email}
            </p>
            {links.length === 0 ? (
              <p className="text-slate-400">
                No links added.
              </p>
            ) : (
              links.map((link) => (
                <a
                  key={link.label}
                  href={normalizeExternalUrl(link.value)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary justify-start"
                >
                  {link.icon}
                  {link.label}
                </a>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Profile;
