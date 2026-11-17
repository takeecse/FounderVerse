import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaCircleCheck,
  FaFileLines,
  FaPaperPlane,
  FaShieldHalved,
  FaXmark,
} from "react-icons/fa6";
import { getProfile } from "../api/userApi";
import { getMyStartups } from "../api/startupApi";
import {
  getMyVerificationApplications,
  submitVerificationApplication,
} from "../api/verificationApi";
import {
  VERIFIABLE_ROLES,
  getVerificationStatus,
  normalizeRoles,
} from "../utils/roles";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_FILES = ".jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.txt,.doc,.docx";

const emptyEvidence = {
  organizationName: "",
  website: "",
  linkedin: "",
  background: "",
  notes: "",
};

const fileSizeLabel = (size) => size >= 1024 * 1024
  ? `${(size / (1024 * 1024)).toFixed(1)} MB`
  : `${Math.max(1, Math.round(size / 1024))} KB`;

function Verification({ subjectType = "user" }) {
  const isStartup = subjectType === "startup";
  const [searchParams] = useSearchParams();
  const requestedStartupId = searchParams.get("startupId") || "";
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [startups, setStartups] = useState([]);
  const [role, setRole] = useState("");
  const [startupId, setStartupId] = useState("");
  const [evidence, setEvidence] = useState(emptyEvidence);
  const [files, setFiles] = useState([]);
  const [filePickerKey, setFilePickerKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const verifiableRoles = useMemo(
    () => normalizeRoles(profile).filter((item) => VERIFIABLE_ROLES.includes(item)),
    [profile]
  );
  const selectedStartup = startups.find((startup) => startup._id === startupId);
  const visibleApplications = applications.filter((application) =>
    isStartup
      ? application.subjectType === "startup" || Boolean(application.startup)
      : application.subjectType !== "startup" && !application.startup
  );
  const hasPendingApplication = applications.some((application) =>
    application.status === "pending" && (
      subjectType === "startup"
        ? (application.subjectType === "startup" || application.startup?._id) &&
          (application.startup?._id || application.startup) === startupId
        : application.subjectType !== "startup" && application.role === role
    )
  );
  const isAlreadyVerified = subjectType === "startup"
    ? selectedStartup?.verificationStatus === "verified"
    : role && getVerificationStatus(profile, role) === "verified";
  const isPending = hasPendingApplication || (
    isStartup
      ? selectedStartup?.verificationStatus === "pending"
      : false
  );

  const loadVerification = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, verificationRes, startupsRes] = await Promise.all([
        getProfile(),
        getMyVerificationApplications(),
        getMyStartups(),
      ]);

      const ownStartups = (Array.isArray(startupsRes.data) ? startupsRes.data : [])
        .filter((startup) => startup.viewerPermissions?.isFounder !== false);
      const nextRoles = normalizeRoles(profileRes.data).filter((item) =>
        VERIFIABLE_ROLES.includes(item)
      );

      setProfile(profileRes.data);
      setApplications(verificationRes.data.applications || []);
      setStartups(ownStartups);
      setRole((current) => nextRoles.includes(current) ? current : nextRoles[0] || "");
      setStartupId((current) => {
        if (ownStartups.some((startup) => startup._id === current)) return current;
        if (ownStartups.some((startup) => startup._id === requestedStartupId)) return requestedStartupId;
        return ownStartups[0]?._id || "";
      });
      setError("");
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.response?.data?.message || "Could not load verification details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [requestedStartupId]);

  useEffect(() => {
    loadVerification();
    window.addEventListener("founderverse:verification-updated", loadVerification);
    return () => window.removeEventListener("founderverse:verification-updated", loadVerification);
  }, [loadVerification]);

  const handleEvidenceChange = (event) => {
    setEvidence((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setError("");
    setSuccess("");

    const nextFiles = [...files, ...selectedFiles];
    if (nextFiles.length > MAX_FILES) {
      setError(`Attach no more than ${MAX_FILES} files.`);
      setFiles(nextFiles.slice(0, MAX_FILES));
    } else {
      const oversized = nextFiles.find((file) => file.size > MAX_FILE_SIZE);
      if (oversized) {
        setError(`${oversized.name} is larger than 8 MB.`);
      } else {
        setFiles(nextFiles);
      }
    }
    setFilePickerKey((value) => value + 1);
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isStartup && !role) {
      setError("Add a verifiable role to your profile before applying.");
      return;
    }
    if (isStartup && !startupId) {
      setError("Create a startup before applying for startup verification.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        subjectType,
        ...(isStartup ? { startupId } : { role }),
        evidence,
      };
      await submitVerificationApplication(payload, files);
      setEvidence(emptyEvidence);
      setFiles([]);
      setFilePickerKey((value) => value + 1);
      setSuccess("Your application was sent to the admin review queue. We’ll notify you when it is reviewed.");
      await loadVerification();
      window.dispatchEvent(new Event("founderverse:profile-updated"));
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || "Verification request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading verification...
      </div>
    );
  }

  return (
    <div className="page-shell page-wide">
      <div className="section-head">
        <div>
          <p className="eyebrow">Trust layer</p>
          <h1 className="page-title">{isStartup ? "Startup Verification" : "Profile Verification"}</h1>
          <p className="page-subtitle">
            {isStartup
              ? "Request a verified badge for a startup you founded. Admins review its business details and evidence before adding a badge."
              : "Request a verified badge for your professional profile. Admins review your role and evidence before adding a badge."}
          </p>
        </div>
        <Link
          to={isStartup ? "/verification/profile" : "/verification/startup"}
          className="btn btn-secondary"
        >
          {isStartup ? "Verify Profile" : "Verify a Startup"}
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form onSubmit={handleSubmit} className="glass-panel p-6">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <FaShieldHalved className="text-cyan-200" />
            {isStartup ? "Verify a Startup" : "Verify Your Profile"}
          </h2>

          {!isStartup ? (
            verifiableRoles.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Add a supported role to your profile before requesting verification.
              </p>
            ) : (
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Role to verify</span>
                <select value={role} onChange={(event) => setRole(event.target.value)} className="select" required>
                  {verifiableRoles.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            )
          ) : startups.length === 0 ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
              Create a startup listing first, then return here to request its verification.
              <Link to="/create-startup" className="ml-1 font-bold text-cyan-200 hover:text-cyan-100">Create a startup</Link>
            </div>
          ) : (
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-300">Startup to verify</span>
              <select value={startupId} onChange={(event) => setStartupId(event.target.value)} className="select" required>
                {startups.map((startup) => (
                  <option key={startup._id} value={startup._id}>{startup.title}</option>
                ))}
              </select>
              {selectedStartup?.verificationStatus === "verified" && (
                <span className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-sky-200"><FaCircleCheck /> Already verified</span>
              )}
            </label>
          )}

          {(isStartup ? startups.length > 0 : verifiableRoles.length > 0) && (
            <>
              <input
                name="organizationName"
                value={evidence.organizationName}
                onChange={handleEvidenceChange}
                className="field mt-4"
                placeholder={isStartup ? "Legal business name (if different)" : "Startup, company, fund, or organization"}
              />
              <input name="website" value={evidence.website} onChange={handleEvidenceChange} className="field mt-4" placeholder="Website" />
              <input name="linkedin" value={evidence.linkedin} onChange={handleEvidenceChange} className="field mt-4" placeholder="LinkedIn" />
              <textarea
                name="background"
                value={evidence.background}
                onChange={handleEvidenceChange}
                className="textarea mt-4"
                placeholder={isStartup ? "Describe the product, business, and evidence that establishes the startup is legitimate." : "Relevant background, track record, investments, mentorship experience, or startup details."}
              />
              <textarea name="notes" value={evidence.notes} onChange={handleEvidenceChange} className="textarea mt-4" placeholder="Additional context for admins." />

              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Documents or images</span>
                <input
                  key={filePickerKey}
                  type="file"
                  multiple
                  accept={ACCEPTED_FILES}
                  onChange={handleFileChange}
                  className="field file:mr-3 file:rounded-md file:border-0 file:bg-cyan-300/15 file:px-3 file:py-2 file:font-bold file:text-cyan-100"
                />
                <span className="mt-2 block text-xs text-slate-500">Up to 5 files, 8 MB each. Images, PDF, DOC, DOCX, and TXT are supported.</span>
              </label>

              {files.length > 0 && (
                <ul className="mt-3 grid gap-2">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                      <FaFileLines className="shrink-0 text-cyan-200" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-200">{file.name}</span>
                        <span className="text-xs text-slate-500">{fileSizeLabel(file.size)}</span>
                      </span>
                      <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`} className="grid h-8 w-8 place-items-center rounded-md text-slate-400 hover:bg-rose-400/10 hover:text-rose-200">
                        <FaXmark />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {error && <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>}
              {success && <p role="status" className="mt-4 text-sm text-emerald-200">{success}</p>}

              <button
                type="submit"
                disabled={submitting || isAlreadyVerified || isPending || (isStartup && !startupId)}
                className="btn btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPaperPlane />
                {submitting ? "Submitting..." : isAlreadyVerified ? "Already verified" : isPending ? "In review" : "Submit Verification"}
              </button>
            </>
          )}
          {error && !(isStartup ? startups.length > 0 : verifiableRoles.length > 0) && (
            <p role="alert" className="mt-4 text-sm text-rose-200">{error}</p>
          )}
          {success && <p role="status" className="mt-4 text-sm text-emerald-200">{success}</p>}
        </form>

        <div className="grid content-start gap-5">
          <section className="glass-panel p-6">
            <h2 className="text-2xl font-black">Current Status</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {!isStartup && normalizeRoles(profile).map((item) => {
                const rawStatus = VERIFIABLE_ROLES.includes(item) ? getVerificationStatus(profile, item) : "not required";
                const hasPendingRoleApplication = applications.some((application) =>
                  application.subjectType !== "startup" && application.role === item && application.status === "pending"
                );
                const status = rawStatus === "pending" && !hasPendingRoleApplication ? "not requested" : rawStatus;
                return (
                  <span key={item} className={`chip ${status === "verified" ? "border-sky-300/40 bg-sky-300/10 text-sky-100" : ""}`}>
                    {item}
                    {status === "verified" && <FaCircleCheck />}
                    {`: ${status}`}
                  </span>
                );
              })}
              {isStartup && startups.map((startup) => (
                <span key={startup._id} className={`chip ${startup.verificationStatus === "verified" ? "border-sky-300/40 bg-sky-300/10 text-sky-100" : ""}`}>
                  {startup.title}: {startup.verificationStatus || "unverified"}
                  {startup.verificationStatus === "verified" && <FaCircleCheck />}
                </span>
              ))}
            </div>
          </section>

          <section className="glass-panel p-6">
            <h2 className="text-2xl font-black">Your Applications</h2>
            <div className="mt-5 grid gap-3">
              {visibleApplications.length === 0 ? (
                <p className="text-sm text-slate-400">No verification requests submitted yet.</p>
              ) : (
                visibleApplications.map((application) => {
                  const isStartupApplication = application.subjectType === "startup" || Boolean(application.startup);
                  return (
                    <article key={application._id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-black">
                          {isStartupApplication ? application.startup?.title || "Startup" : application.role}
                          {isStartupApplication ? " · Startup" : " · Profile"}
                        </h3>
                        <span className={`chip ${application.status === "verified" ? "border-sky-300/40 bg-sky-300/10 text-sky-100" : ""}`}>
                          {application.status}
                          {application.status === "verified" && <FaCircleCheck />}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {application.evidence?.background || application.evidence?.notes || "Evidence submitted."}
                      </p>
                      {application.evidence?.attachments?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {application.evidence.attachments.map((attachment) => (
                            <a key={attachment._id || attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="btn btn-secondary text-sm">
                              <FaFileLines /> {attachment.name}
                            </a>
                          ))}
                        </div>
                      )}
                      {application.reviewerNote && <p className="mt-2 text-sm text-amber-100">Admin note: {application.reviewerNote}</p>}
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default Verification;
