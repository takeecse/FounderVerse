import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaFlag } from "react-icons/fa6";
import { submitReport } from "../api/reportApi";
import { isAuthenticated } from "../utils/session";

function ReportTargetButton({ targetType, targetId, targetName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleOpen = () => {
    if (!isAuthenticated()) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    setOpen((value) => !value);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await submitReport({
        targetType,
        targetId,
        reason,
        details,
      });
      setMessage(response.data.message || "Report submitted for review.");
      setDetails("");
      setOpen(false);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not submit this report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button type="button" onClick={handleOpen} className="btn btn-secondary">
        <FaFlag />
        Report
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="glass-panel absolute right-0 top-full z-30 mt-3 w-[min(22rem,calc(100vw-2rem))] space-y-3 p-4 shadow-2xl"
        >
          <div>
            <h3 className="font-black">Report {targetType === "user" ? "profile" : "startup"}</h3>
            <p className="mt-1 text-xs text-slate-400">{targetName}</p>
          </div>
          <label className="block text-sm font-bold text-slate-300">
            Reason
            <select
              className="select mt-2 px-3"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            >
              <option value="spam">Spam</option>
              <option value="misleading">Misleading information</option>
              <option value="harassment">Harassment or abuse</option>
              <option value="impersonation">Impersonation</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-300">
            Details (optional)
            <textarea
              className="textarea mt-2 min-h-24"
              maxLength={1200}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Share details that may help a moderator review this."
            />
          </label>
          {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Sending..." : "Submit report"}
            </button>
          </div>
        </form>
      )}

      {message && <p role="status" className="mt-2 text-xs text-emerald-200">{message}</p>}
    </div>
  );
}

export default ReportTargetButton;
