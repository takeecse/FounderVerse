import { useEffect, useMemo, useState } from "react";
import {
  FaPaperPlane,
  FaShieldHalved,
} from "react-icons/fa6";
import { getProfile } from "../api/userApi";
import {
  getMyVerificationApplications,
  submitVerificationApplication,
} from "../api/verificationApi";
import {
  VERIFIABLE_ROLES,
  getVerificationStatus,
  normalizeRoles,
} from "../utils/roles";

const emptyEvidence = {
  organizationName: "",
  website: "",
  linkedin: "",
  background: "",
  notes: "",
};

function Verification() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [role, setRole] = useState("");
  const [evidence, setEvidence] =
    useState(emptyEvidence);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const verifiableRoles = useMemo(
    () =>
      normalizeRoles(profile).filter((item) =>
        VERIFIABLE_ROLES.includes(item)
      ),
    [profile]
  );

  const loadVerification = async () => {
    try {
      setLoading(true);
      const [profileRes, verificationRes] =
        await Promise.all([
          getProfile(),
          getMyVerificationApplications(),
        ]);

      setProfile(profileRes.data);
      setApplications(
        verificationRes.data.applications || []
      );

      const nextRoles = normalizeRoles(
        profileRes.data
      ).filter((item) =>
        VERIFIABLE_ROLES.includes(item)
      );

      setRole((current) => current || nextRoles[0] || "");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerification();
  }, []);

  const handleEvidenceChange = (e) => {
    setEvidence({
      ...evidence,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!role) return;

    try {
      setSubmitting(true);
      await submitVerificationApplication({
        role,
        evidence,
      });
      setEvidence(emptyEvidence);
      await loadVerification();
      window.dispatchEvent(
        new Event("founderverse:profile-updated")
      );
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Verification request failed"
      );
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
          <h1 className="page-title">
            Verify Your Professional Role
          </h1>
          <p className="page-subtitle">
            Submit evidence for Founder, Investor, or Mentor
            verification. Selecting a role only adds it to your
            profile; admins review verification separately.
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="glass-panel p-6"
        >
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <FaShieldHalved className="text-cyan-200" />
            Submit Evidence
          </h2>

          {verifiableRoles.length === 0 ? (
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Add Founder, Investor, or Mentor to your profile
              before submitting verification.
            </p>
          ) : (
            <>
              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-bold text-slate-300">
                  Role to verify
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="select"
                  required
                >
                  {verifiableRoles.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <input
                name="organizationName"
                value={evidence.organizationName}
                onChange={handleEvidenceChange}
                className="field mt-4"
                placeholder="Startup, company, fund, or organization"
              />
              <input
                name="website"
                value={evidence.website}
                onChange={handleEvidenceChange}
                className="field mt-4"
                placeholder="Website"
              />
              <input
                name="linkedin"
                value={evidence.linkedin}
                onChange={handleEvidenceChange}
                className="field mt-4"
                placeholder="LinkedIn"
              />
              <textarea
                name="background"
                value={evidence.background}
                onChange={handleEvidenceChange}
                className="textarea mt-4"
                placeholder="Relevant background, track record, investments, mentorship experience, or startup details."
              />
              <textarea
                name="notes"
                value={evidence.notes}
                onChange={handleEvidenceChange}
                className="textarea mt-4"
                placeholder="Additional context for admins."
              />

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary mt-5"
              >
                <FaPaperPlane />
                {submitting
                  ? "Submitting..."
                  : "Submit Verification"}
              </button>
            </>
          )}
        </form>

        <div className="grid gap-5">
          <section className="glass-panel p-6">
            <h2 className="text-2xl font-black">
              Current Role Status
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {normalizeRoles(profile).map((item) => {
                const status =
                  VERIFIABLE_ROLES.includes(item)
                    ? getVerificationStatus(profile, item)
                    : "not required";

                return (
                  <span
                    key={item}
                    className={`chip ${status === "verified" ? "chip-mint" : ""
                      }`}
                  >
                    {item}: {status}
                  </span>
                );
              })}
            </div>
          </section>

          <section className="glass-panel p-6">
            <h2 className="text-2xl font-black">
              Verification Requests
            </h2>
            <div className="mt-5 grid gap-3">
              {applications.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No verification requests submitted yet.
                </p>
              ) : (
                applications.map((application) => (
                  <article
                    key={application._id}
                    className="rounded-lg border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-black">
                        {application.role}
                      </h3>
                      <span className="chip">
                        {application.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {application.evidence?.background ||
                        application.evidence?.notes ||
                        "Evidence submitted."}
                    </p>
                    {application.reviewerNote && (
                      <p className="mt-2 text-sm text-amber-100">
                        Admin note: {application.reviewerNote}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

export default Verification;
