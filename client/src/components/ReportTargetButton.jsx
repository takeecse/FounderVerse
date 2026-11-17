import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { FaFileLines, FaFlag, FaXmark } from "react-icons/fa6";
import { submitReport } from "../api/reportApi";
import { isAuthenticated } from "../utils/session";

const MAX_REPORT_FILES = 5;
const MAX_REPORT_FILE_SIZE = 8 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const fileKey = (file) => `${file.name}:${file.size}:${file.lastModified}`;

function ReportAttachmentItem({ file, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState("");
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) return undefined;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  const sizeLabel = file.size >= 1024 * 1024
    ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(file.size / 1024))} KB`;

  return (
    <li className="flex min-w-0 items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-2">
      {previewUrl ? (
        <img src={previewUrl} alt={`Preview of ${file.name}`} className="h-12 w-12 shrink-0 rounded-md object-cover" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
          <FaFileLines />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-slate-200">{file.name}</span>
        <span className="mt-1 block text-xs text-slate-500">{sizeLabel}</span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200"
      >
        <FaXmark />
      </button>
    </li>
  );
}

function ReportTargetButton({ targetType, targetId, targetName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState([]);
  const [filePickerKey, setFilePickerKey] = useState(0);
  const [attachmentNotice, setAttachmentNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dialogTitleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, submitting]);

  const handleOpen = () => {
    if (!isAuthenticated()) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    setOpen(true);
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
      }, files);
      setMessage(response.data.message || "Report submitted for review.");
      setDetails("");
      setFiles([]);
      setAttachmentNotice("");
      setFilePickerKey((value) => value + 1);
      setOpen(false);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not submit this report.");
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

      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setOpen(false);
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            onSubmit={handleSubmit}
            className="glass-panel relative max-h-[90dvh] w-full max-w-xl space-y-4 overflow-y-auto p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="min-w-0">
                <h3 id={dialogTitleId} className="text-xl font-black">
                  Report {targetType === "user" ? "profile" : "startup"}
                </h3>
                <p className="mt-1 break-words text-sm text-slate-400">{targetName}</p>
              </div>
              <button
                type="button"
                aria-label="Close report dialog"
                disabled={submitting}
                onClick={() => setOpen(false)}
                className="btn btn-secondary icon-btn shrink-0"
              >
                <FaXmark />
              </button>
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
              Add evidence files or images (up to 5; 8 MB each)
              <input
                key={filePickerKey}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.pdf,.txt,.doc,.docx"
                multiple
                onChange={(event) => {
                  const selected = Array.from(event.target.files || []);
                  event.target.value = "";

                  const tooLarge = selected.filter((file) => file.size <= 0 || file.size > MAX_REPORT_FILE_SIZE);
                  const unsupported = selected.filter((file) => !SUPPORTED_FILE_TYPES.has(file.type));
                  const valid = selected.filter((file) =>
                    file.size > 0 && file.size <= MAX_REPORT_FILE_SIZE && SUPPORTED_FILE_TYPES.has(file.type)
                  );
                  const skipped = [];
                  if (tooLarge.length) skipped.push("Files must be smaller than 8 MB");
                  if (unsupported.length) skipped.push("Choose an image, PDF, text, DOC, or DOCX file");

                  const existingKeys = new Set(files.map(fileKey));
                  const newFiles = [];
                  valid.forEach((file) => {
                    const key = fileKey(file);
                    if (!existingKeys.has(key)) {
                      existingKeys.add(key);
                      newFiles.push(file);
                    }
                  });
                  const availableSlots = Math.max(MAX_REPORT_FILES - files.length, 0);
                  if (newFiles.length > availableSlots) skipped.push("You can attach up to 5 files");
                  setFiles([...files, ...newFiles.slice(0, availableSlots)]);
                  setAttachmentNotice(skipped.join(". "));
                }}
                className="field mt-2 h-auto py-2 text-xs"
              />
              <span className="mt-2 block text-xs font-normal text-slate-500">
                You can select several at once or add more in another selection.
              </span>
            </label>
            {files.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">Selected evidence</span>
                  <span className="text-slate-500">{files.length}/{MAX_REPORT_FILES}</span>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {files.map((file) => (
                    <ReportAttachmentItem
                      key={fileKey(file)}
                      file={file}
                      onRemove={() => {
                        setFiles((current) => current.filter((item) => fileKey(item) !== fileKey(file)));
                        setAttachmentNotice("");
                      }}
                    />
                  ))}
                </ul>
              </div>
            )}
            {attachmentNotice && <p role="status" className="text-xs text-amber-200">{attachmentNotice}</p>}
            <p className="text-xs leading-5 text-slate-500">
              We’ll send a confirmation notification to you. Only moderators can access this report and its attachments.
            </p>
            <label className="block text-sm font-bold text-slate-300">
              Details (optional)
              <textarea
                className="textarea mt-2 min-h-28"
                maxLength={1200}
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Share details that may help a moderator review this."
              />
            </label>
            {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <button type="button" className="btn btn-secondary" disabled={submitting} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? "Sending..." : "Submit report"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {message && <p role="status" className="mt-2 text-xs text-emerald-200">{message}</p>}
    </div>
  );
}

export default ReportTargetButton;
