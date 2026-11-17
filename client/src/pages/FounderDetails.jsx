import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowUpRightFromSquare,
  FaCircleCheck,
  FaBan,
  FaComments,
  FaGithub,
  FaHandshake,
  FaLinkedin,
  FaLocationDot,
  FaPen,
  FaStar,
} from "react-icons/fa6";
import { getUserById } from "../api/userApi";
import { blockUser, unblockUser } from "../api/userApi";
import ReportTargetButton from "../components/ReportTargetButton";
import PostTimeline from "../components/PostTimeline";
import {
  getRequestStatus,
  sendRequest,
} from "../api/requestApi";
import {
  getCurrentUserId,
  isAuthenticated,
} from "../utils/session";
import { normalizeExternalUrl } from "../utils/links";
import {
  getRoleLabel,
  isVerifiedForRole,
  normalizeRoles,
} from "../utils/roles";

function FounderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requestStatus, setRequestStatus] =
    useState("loading");
  const [sending, setSending] = useState(false);
  const [updatingBlock, setUpdatingBlock] = useState(false);

  const currentUserId = getCurrentUserId();
  const isSelf = currentUserId === id;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUserById(id);
        setUser(res.data);

        if (isAuthenticated() && currentUserId !== id) {
          const statusRes = await getRequestStatus(id);
          setRequestStatus(statusRes.data.status || "none");
        } else {
          setRequestStatus("none");
        }
      } catch (error) {
        console.error(error);
        setRequestStatus("none");
      }
    };

    fetchUser();
    window.addEventListener("founderverse:verification-updated", fetchUser);
    return () => window.removeEventListener("founderverse:verification-updated", fetchUser);
  }, [id, currentUserId]);

  const handleRequest = async () => {
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { from: `/founders/${id}` },
      });
      return;
    }

    if (isSelf || !user) return;

    try {
      setSending(true);
      await sendRequest(
        user._id,
        null,
        `Hi ${user.name}, I'd like to collaborate with you.`
      );
      setRequestStatus("pending");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to send request"
      );
    } finally {
      setSending(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!isAuthenticated() || isSelf || !user) return;
    try {
      setUpdatingBlock(true);
      if (user.isBlockedByMe) {
        await unblockUser(user._id);
        setUser((current) => ({ ...current, isBlockedByMe: false }));
      } else {
        await blockUser(user._id);
        setUser((current) => ({ ...current, isBlockedByMe: true }));
      }
      window.dispatchEvent(new Event("founderverse:chat-updated"));
    } catch (error) {
      alert(error.response?.data?.message || "Could not update this block.");
    } finally {
      setUpdatingBlock(false);
    }
  };

  if (!user) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading member...
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
  const isConnected =
    requestStatus === "connected" ||
    requestStatus === "accepted";
  const isPending = requestStatus === "pending";
  const hasVerifiedRole = normalizeRoles(user).some((role) =>
    isVerifiedForRole(user, role)
  );

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Member profile</p>
          <h1 className="page-title">
            {user.name}
          </h1>
          <p className="page-subtitle">
            {user.bio ||
              "Explore this member profile and start a focused collaboration conversation."}
          </p>
        </div>
        <Link to="/founders" className="btn btn-secondary">
          <FaArrowLeft />
          Members
        </Link>
      </div>

      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <img
              src={
                user.photoURL ||
                `https://ui-avatars.com/api/?name=${user.name}`
              }
              alt={user.name}
              className="avatar h-28 w-28"
            />

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-4xl font-black">
                  {user.name}
                </h2>
                <span className="chip chip-amber">
                  <FaStar />
                  {user.executionScore || 0}
                </span>
              </div>
              {user.username && <p className="mt-2 font-semibold text-cyan-200">@{user.username}</p>}
              <p className="mt-2 text-xl text-cyan-200">
                {getRoleLabel(user)}
              </p>
              {hasVerifiedRole && (
                <span className="chip mt-2 border-sky-300/30 bg-sky-300/10 text-sky-100">
                  <FaCircleCheck />
                  Verified
                </span>
              )}
              <p className="mt-2 flex items-center gap-2 text-slate-400">
                <FaLocationDot />
                {user.location || "Remote"}
              </p>
              <p className="mt-2 text-slate-400">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isSelf && isConnected && (
              <span className="chip chip-mint">
                Connected
              </span>
            )}

            {!isSelf && isPending && (
              <span className="chip chip-amber">
                Request pending
              </span>
            )}

            {!isSelf && !user.isBlockedByMe && !user.hasBlockedMe &&
              !isConnected &&
              !isPending && (
              <button
                type="button"
                onClick={handleRequest}
                disabled={
                  sending || requestStatus === "loading"
                }
                className="btn btn-primary"
              >
                <FaHandshake />
                {sending
                  ? "Sending..."
                  : requestStatus === "loading"
                    ? "Checking..."
                    : "Request Collaboration"}
              </button>
            )}

            {isSelf ? (
              <Link
                to="/edit-profile"
                className="btn btn-secondary"
              >
                <FaPen />
                Edit My Profile
              </Link>
            ) : user.isBlockedByMe || user.hasBlockedMe ? (
              <span className="btn btn-secondary cursor-not-allowed opacity-60">
                <FaBan />
                Messaging unavailable
              </span>
            ) : (
              <Link
                to={
                  isAuthenticated()
                    ? `/chat/${user._id}`
                    : "/login"
                }
                state={
                  isAuthenticated()
                    ? undefined
                    : { from: `/chat/${user._id}` }
                }
                className="btn btn-secondary"
              >
                <FaComments />
                Message
              </Link>
            )}
            {!isSelf && (
              <ReportTargetButton
                targetType="user"
                targetId={user._id}
                targetName={user.name}
              />
            )}
            {!isSelf && isAuthenticated() && (
              <button
                type="button"
                onClick={handleBlockToggle}
                disabled={updatingBlock}
                className={user.isBlockedByMe ? "btn btn-secondary" : "btn btn-danger"}
              >
                <FaBan />
                {updatingBlock ? "Saving..." : user.isBlockedByMe ? "Unblock member" : "Block member"}
              </button>
            )}
          </div>
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
      </section>

      <section className="two-grid mt-6">
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

        <div className="glass-card p-6">
          <h3 className="text-2xl font-black">
            Links
          </h3>
          <div className="mt-5 grid gap-3">
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

      <section className="post-profile-section mt-8">
        <PostTimeline key={user._id} type="user" id={user._id} />
      </section>
    </div>
  );
}

export default FounderDetails;
