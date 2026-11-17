import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowUpRightFromSquare,
  FaBan,
  FaCircleCheck,
  FaComments,
  FaHandshake,
  FaLocationDot,
  FaPen,
  FaTrash,
  FaUsers,
} from "react-icons/fa6";
import {
  getRequestStatus,
  sendRequest,
} from "../api/requestApi";
import {
  getStartupById,
  inviteStartupMember,
  removeTeamMember,
  submitStartupAppeal,
  updateStartupMember,
} from "../api/startupApi";
import ReportTargetButton from "../components/ReportTargetButton";
import PostComposer from "../components/PostComposer";
import PostTimeline from "../components/PostTimeline";
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

function StartupDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();
  const [startup, setStartup] = useState(null);
  const [requestMessage, setRequestMessage] =
    useState("");
  const [requestStatus, setRequestStatus] =
    useState("none");
  const [sending, setSending] = useState(false);
  const [appealMessage, setAppealMessage] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState("Member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState("");

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await getStartupById(id);
        setStartup(res.data);

        if (
          isAuthenticated() &&
          currentUserId &&
          res.data.founder?._id !== currentUserId
        ) {
          const statusRes = await getRequestStatus(
            res.data.founder._id,
            res.data._id
          );

          setRequestStatus(statusRes.data.status || "none");
        } else {
          setRequestStatus("none");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchStartup();
    window.addEventListener("founderverse:verification-updated", fetchStartup);
    return () => window.removeEventListener("founderverse:verification-updated", fetchStartup);
  }, [id, currentUserId]);

  const isFounder =
    startup?.founder?._id === currentUserId;
  const isStartupAdmin = Boolean(startup?.viewerPermissions?.isAdmin) ||
    startup?.teamMemberRoles?.some((membership) =>
      String(membership.user?._id || membership.user) === String(currentUserId) && membership.isAdmin
    );
  const canManageStartup = isFounder || isStartupAdmin;
  const isStartupMember =
    startup?.teamMembers?.some(
      (member) => (member._id || member) === currentUserId
    ) ||
    requestStatus === "member" ||
    requestStatus === "accepted";
  const hasPendingRequest = requestStatus === "pending";
  const isBanned = startup?.moderationStatus === "banned";
  const getTeamMembership = (memberId) => startup?.teamMemberRoles?.find((membership) =>
    String(membership.user?._id || membership.user) === String(memberId)
  ) || null;

  const handleAppealSubmit = async (event) => {
    event.preventDefault();
    if (!appealMessage.trim()) return;

    try {
      setSubmittingAppeal(true);
      const response = await submitStartupAppeal(startup._id, appealMessage.trim());
      setStartup((current) => ({ ...current, appeal: response.data.appeal }));
      setAppealMessage("");
    } catch (error) {
      alert(error.response?.data?.message || "Could not submit the appeal.");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this team member?")) {
      return;
    }

    try {
      await removeTeamMember(startup._id, memberId);
      setStartup({
        ...startup,
        teamMembers: startup.teamMembers.filter(
          (member) => member._id !== memberId
        ),
        teamMemberRoles: startup.teamMemberRoles?.filter(
          (membership) => String(membership.user?._id || membership.user) !== String(memberId)
        ) || [],
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to remove team member"
      );
    }
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    setInviteStatus("");
    setInviteError("");
    if (!inviteUsername.trim() || !inviteRole.trim()) return;

    try {
      setSendingInvite(true);
      const response = await inviteStartupMember(startup._id, {
        username: inviteUsername.trim(),
        role: inviteRole.trim(),
        message: inviteMessage.trim(),
      });
      const invitedUsername = response.data.invitee?.username || inviteUsername.replace(/^@/, "");
      setInviteStatus(`Invitation sent to @${invitedUsername}. They will join after accepting.`);
      setInviteUsername("");
      setInviteMessage("");
    } catch (error) {
      setInviteError(error.response?.data?.message || "Could not send this invitation.");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleStartupAdminToggle = async (member) => {
    const membership = startup.teamMemberRoles?.find((item) =>
      String(item.user?._id || item.user) === String(member._id)
    );
    const isAdmin = Boolean(membership?.isAdmin);
    if (!isAdmin && !window.confirm(`Give ${member.name} startup admin access? They will be able to edit this startup and manage its team.`)) {
      return;
    }

    try {
      setUpdatingMemberId(member._id);
      const response = await updateStartupMember(startup._id, member._id, { isAdmin: !isAdmin });
      setStartup((current) => ({ ...current, teamMemberRoles: response.data.teamMemberRoles }));
    } catch (error) {
      alert(error.response?.data?.message || "Could not update startup admin access.");
    } finally {
      setUpdatingMemberId("");
    }
  };

  const handleSendRequest = async () => {
    if (!isAuthenticated()) {
      navigate("/login", {
        state: { from: `/startups/${id}` },
      });
      return;
    }

    if (!requestMessage.trim()) {
      alert("Please write a message");
      return;
    }

    try {
      setSending(true);
      await sendRequest(
        startup.founder._id,
        startup._id,
        requestMessage.trim()
      );
      setRequestMessage("");
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

  if (!startup) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading startup...
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Startup profile</p>
          <h1 className="page-title flex flex-wrap items-center gap-3">
            {startup.title}
            {startup.verificationStatus === "verified" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1 text-sm font-bold text-sky-100">
                <FaCircleCheck /> Verified startup
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            {startup.tagline}
          </p>
        </div>
        <Link
          to="/startups"
          className="btn btn-secondary"
        >
          <FaArrowLeft />
          Startups
        </Link>
      </div>

      <section className="glass-panel p-6 sm:p-8">
        {isBanned && (
          <div className="mb-6 rounded-lg border border-rose-300/30 bg-rose-300/10 p-4">
            <p className="flex items-center gap-2 font-black text-rose-100">
              <FaBan /> Temporarily banned listing
            </p>
            <p className="mt-2 text-sm leading-6 text-rose-100/80">
              {startup.banReason || "This listing is under a temporary moderation ban."}
            </p>
            {startup.banMessage && (
              <p className="mt-2 text-sm leading-6 text-rose-100/70">{startup.banMessage}</p>
            )}
            <p className="mt-2 text-xs text-rose-100/70">
              Appeal by {startup.appealDeadline ? new Date(startup.appealDeadline).toLocaleDateString() : "the deadline shown to the founder"}. The listing will be permanently removed if no appeal is approved by then.
            </p>
          </div>
        )}
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-5">
            <img
              src={
                startup.logo ||
                `https://ui-avatars.com/api/?name=${startup.title}`
              }
              alt={startup.title}
              className="avatar h-20 w-20"
            />
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="chip">
                  {startup.stage || "Idea"}
                </span>
                {startup.isHiring && (
                  <span className="chip chip-mint">
                    Hiring
                  </span>
                )}
                {startup.fundingStatus && (
                  <span className="chip chip-amber">
                    {startup.fundingStatus}
                  </span>
                )}
                {isBanned && <span className="chip text-rose-200">Temporarily banned</span>}
              </div>
              <p className="mt-5 max-w-3xl leading-7 text-slate-300">
                {startup.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {startup.website && (
              <a
                href={normalizeExternalUrl(startup.website)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <FaArrowUpRightFromSquare />
                Website
              </a>
            )}
            {canManageStartup ? (
              !isBanned && (
                <Link
                  to={`/edit-startup/${startup._id}`}
                  className="btn btn-primary"
                >
                  <FaPen />
                  Edit Startup
                </Link>
              )
            ) : isBanned ? (
              <span className="btn btn-secondary cursor-not-allowed opacity-60">
                <FaBan />
                Founder contact paused
              </span>
            ) : (
              <Link
                to={
                  isAuthenticated()
                    ? `/chat/${startup.founder._id}`
                    : "/login"
                }
                state={
                  isAuthenticated()
                    ? undefined
                    : {
                        from: `/chat/${startup.founder._id}`,
                      }
                }
                className="btn btn-primary"
              >
                <FaComments />
                Message Founder
              </Link>
            )}
            {!canManageStartup && (
              <ReportTargetButton
                targetType="startup"
                targetId={startup._id}
                targetName={startup.title}
              />
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-white/10 pt-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold text-slate-400">
              Team
            </p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-black">
              <FaUsers className="text-cyan-200" />
              {startup.teamMembers.length + 1}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400">
              Industry
            </p>
            <p className="mt-1 text-2xl font-black">
              {startup.industry || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400">
              Location
            </p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-black">
              <FaLocationDot className="text-emerald-200" />
              {startup.location || "Remote"}
            </p>
          </div>
        </div>
      </section>

      <section className="two-grid mt-6">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-black">
            Tech Stack
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {startup.techStack?.length > 0 ? (
              startup.techStack.map((tech) => (
                <span key={tech} className="chip">
                  {tech}
                </span>
              ))
            ) : (
              <p className="text-slate-400">
                No stack listed.
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-black">
            Looking For
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {startup.lookingFor?.length > 0 ? (
              startup.lookingFor.map((item) => (
                <span
                  key={item}
                  className="chip chip-mint"
                >
                  {item}
                </span>
              ))
            ) : (
              <p className="text-slate-400">
                No needs listed.
              </p>
            )}
          </div>
        </div>
      </section>

      {isFounder && isBanned && (
        <section className="glass-panel mt-6 p-6">
          <h2 className="text-2xl font-black">Appeal this decision</h2>
          {startup.appeal?.status === "pending" ? (
            <p className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
              Your appeal was submitted on {new Date(startup.appeal.submittedAt).toLocaleDateString()} and is waiting for admin review.
            </p>
          ) : startup.appealDeadline && new Date(startup.appealDeadline) <= new Date() ? (
            <p className="mt-3 text-sm text-rose-200">The 30-day appeal period has ended.</p>
          ) : (
            <form onSubmit={handleAppealSubmit} className="mt-3">
              <p className="text-sm leading-6 text-slate-400">Explain why the ban should be reviewed. You can appeal until {startup.appealDeadline ? new Date(startup.appealDeadline).toLocaleDateString() : "the stated deadline"}.</p>
              <textarea
                className="textarea mt-4"
                maxLength={1200}
                value={appealMessage}
                onChange={(event) => setAppealMessage(event.target.value)}
                placeholder="Share context or evidence for the moderation team..."
                required
              />
              <button type="submit" disabled={submittingAppeal || !appealMessage.trim()} className="btn btn-primary mt-4">
                {submittingAppeal ? "Submitting..." : "Submit appeal"}
              </button>
            </form>
          )}
        </section>
      )}

      {!canManageStartup && !isBanned && (
        <section className="glass-panel mt-6 p-6">
          <h2 className="text-2xl font-black">
            Join This Startup
          </h2>
          {isStartupMember ? (
            <p className="mt-2 inline-flex rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100">
              Connected / Member
            </p>
          ) : hasPendingRequest ? (
            <p className="mt-2 inline-flex rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100">
              Request pending
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-400">
                Send a direct, specific request to the founder.
              </p>
              <textarea
                value={requestMessage}
                onChange={(e) =>
                  setRequestMessage(e.target.value)
                }
                placeholder="Tell the founder what you can contribute..."
                className="textarea mt-5"
              />
              <button
                type="button"
                onClick={handleSendRequest}
                disabled={sending}
                className="btn btn-primary mt-4"
              >
                <FaHandshake />
                {sending ? "Sending..." : "Send Request"}
              </button>
            </>
          )}
        </section>
      )}

      {canManageStartup && !isBanned && (
        <section className="glass-panel mt-6 p-6">
          <h2 className="text-2xl font-black">Invite a startup member</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Invite someone by their unique username and choose their role. They become a team member only after accepting.
          </p>
          <form onSubmit={handleInviteSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-300">
              Username
              <input
                className="field"
                value={inviteUsername}
                onChange={(event) => setInviteUsername(event.target.value)}
                placeholder="@username"
                maxLength={25}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-300">
              Startup role
              <input
                className="field"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value.slice(0, 60))}
                placeholder="Product Designer, Engineer, Advisor..."
                maxLength={60}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-300 md:col-span-2">
              Invitation note (optional)
              <textarea
                className="textarea min-h-24"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value.slice(0, 1200))}
                placeholder="Tell them what you would like them to help with..."
                maxLength={1200}
              />
            </label>
            {inviteError && <p role="alert" className="text-sm text-rose-200 md:col-span-2">{inviteError}</p>}
            {inviteStatus && <p role="status" className="text-sm text-emerald-200 md:col-span-2">{inviteStatus}</p>}
            <button type="submit" disabled={sendingInvite || !inviteUsername.trim() || !inviteRole.trim()} className="btn btn-primary md:col-span-2 md:justify-self-start">
              {sendingInvite ? "Sending invitation..." : "Send invitation"}
            </button>
          </form>
        </section>
      )}

      <section className="two-grid mt-6">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-black">
            Founder
          </h2>
          <div className="mt-5 flex items-center gap-4">
            <img
              src={
                startup.founder.photoURL ||
                `https://ui-avatars.com/api/?name=${startup.founder.name}`
              }
              alt={startup.founder.name}
              className="avatar h-14 w-14"
            />
            <div>
              <Link
                to={`/founders/${startup.founder._id}`}
                className="text-xl font-black hover:text-cyan-200"
              >
                {startup.founder.name}
              </Link>
              <p className="text-sm text-slate-400">
                {startup.founder.email}
              </p>
              <p className="text-sm text-cyan-200">
                {getRoleLabel(startup.founder)}
              </p>
              {normalizeRoles(startup.founder).some((role) =>
                isVerifiedForRole(startup.founder, role)
              ) && (
                <span className="chip mt-2 border-sky-300/30 bg-sky-300/10 text-sky-100">
                  <FaCircleCheck />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-black">
            Team Members
          </h2>
          <div className="mt-5 grid gap-3">
            {startup.teamMembers.length === 0 ? (
              <p className="text-slate-400">
                No team members yet.
              </p>
            ) : (
              startup.teamMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                >
                  <div>
                    <p className="font-black">
                      {member.name}
                    </p>
                    {member.username && <p className="text-xs text-cyan-200">@{member.username}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">{getTeamMembership(member._id)?.role || "Member"}</span>
                      {getTeamMembership(member._id)?.isAdmin && <span className="chip chip-mint"><FaCircleCheck /> Startup admin</span>}
                    </div>
                    <p className="text-sm text-slate-400">
                      {member.email}
                    </p>
                  </div>
                  {canManageStartup && member._id !== currentUserId && (
                    <div className="flex flex-wrap items-center gap-2">
                      {isFounder && (
                        <button
                          type="button"
                          onClick={() => handleStartupAdminToggle(member)}
                          disabled={updatingMemberId === member._id}
                          className="btn btn-secondary min-h-10 px-3 text-sm"
                        >
                          {updatingMemberId === member._id
                            ? "Saving..."
                            : getTeamMembership(member._id)?.isAdmin
                              ? "Remove admin"
                              : "Make startup admin"}
                        </button>
                      )}
                      {(isFounder || !getTeamMembership(member._id)?.isAdmin) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member._id)}
                          className="btn btn-danger icon-btn"
                          title="Remove member"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="post-profile-section mt-8">
        <PostTimeline
          key={startup._id}
          type="startup"
          id={startup._id}
          composer={canManageStartup && !isBanned
            ? (onPosted) => (
                <PostComposer
                  author={startup.founder}
                  startups={[startup]}
                  defaultStartupId={startup._id}
                  lockStartup
                  onPosted={onPosted}
                />
              )
            : null}
        />
      </section>
    </div>
  );
}

export default StartupDetails;
