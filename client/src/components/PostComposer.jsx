import { useEffect, useState } from "react";
import { FaImage, FaPaperPlane, FaXmark } from "react-icons/fa6";
import { getProfile } from "../api/userApi";
import { getMyStartups } from "../api/startupApi";
import { createPost } from "../api/postApi";
import { isAuthenticated } from "../utils/session";

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_IMAGES = ".jpg,.jpeg,.png,.gif,.webp,.bmp";
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
]);

function ImagePreview({ file, onRemove }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const preview = URL.createObjectURL(file);
    setUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);

  return (
    <div className="post-image-preview">
      {url && <img src={url} alt={`Preview of ${file.name}`} />}
      <span>{file.name}</span>
      <button type="button" aria-label={`Remove ${file.name}`} onClick={onRemove}>
        <FaXmark />
      </button>
    </div>
  );
}

function PostComposer({
  author: providedAuthor = null,
  startups: providedStartups = null,
  defaultStartupId = "",
  lockStartup = false,
  onPosted,
}) {
  const [loadedAuthor, setLoadedAuthor] = useState(null);
  const [loadedStartups, setLoadedStartups] = useState(null);
  const [startupId, setStartupId] = useState(defaultStartupId);
  const [caption, setCaption] = useState("");
  const [files, setFiles] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const author = providedAuthor || loadedAuthor;
  const startups = providedStartups ?? loadedStartups ?? [];

  useEffect(() => {
    if (providedAuthor || !isAuthenticated()) return undefined;

    let active = true;
    getProfile()
      .then((res) => { if (active) setLoadedAuthor(res.data); })
      .catch((requestError) => console.error(requestError));
    return () => { active = false; };
  }, [providedAuthor]);

  useEffect(() => {
    if (providedStartups !== null || !isAuthenticated() || lockStartup) return undefined;

    let active = true;
    getMyStartups()
      .then((res) => {
        if (active) {
          const ownedStartups = Array.isArray(res.data) ? res.data : [];
          setLoadedStartups(ownedStartups.filter((startup) => startup.moderationStatus !== "banned"));
        }
      })
      .catch((requestError) => console.error(requestError));
    return () => { active = false; };
  }, [providedStartups, lockStartup]);

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    const next = [...files, ...selected];
    setError("");

    if (next.length > MAX_IMAGES) {
      setError(`Attach no more than ${MAX_IMAGES} photos.`);
    } else {
      const invalid = next.find((file) => !ACCEPTED_IMAGE_TYPES.has(file.type));
      const oversized = next.find((file) => file.size > MAX_IMAGE_SIZE);
      if (invalid) setError(`${invalid.name} is not an image.`);
      else if (oversized) setError(`${oversized.name} is larger than 8 MB.`);
      else setFiles(next);
    }
    setFileInputKey((value) => value + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!caption.trim() && files.length === 0) {
      setError("Write something or attach a photo to create your post.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createPost({
        caption: caption.trim(),
        ...(startupId ? { startupId } : {}),
      }, files);
      setCaption("");
      setFiles([]);
      setFileInputKey((value) => value + 1);
      onPosted?.(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not publish your post.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated()) return null;

  const selectedStartup = startups.find((startup) => startup._id === startupId);
  const identityName = selectedStartup?.title || author?.name || "Your profile";
  const identityPhoto = selectedStartup?.logo || author?.photoURL;

  return (
    <form onSubmit={handleSubmit} className="post-composer glass-panel">
      <div className="post-composer-heading">
        <div className="post-composer-avatar">
          {identityPhoto ? <img src={identityPhoto} alt="" /> : identityName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">Share a build update</p>
          <p className="mt-1 truncate text-xs text-slate-400">Posting as {identityName}</p>
        </div>
        {!lockStartup && startups.length > 0 && (
          <label className="post-identity-select">
            <span className="sr-only">Post identity</span>
            <select value={startupId} onChange={(event) => setStartupId(event.target.value)}>
              <option value="">Your profile</option>
              {startups.map((startup) => <option key={startup._id} value={startup._id}>{startup.title}</option>)}
            </select>
          </label>
        )}
      </div>

      <textarea
        value={caption}
        onChange={(event) => setCaption(event.target.value.slice(0, 2800))}
        maxLength={2800}
        rows={4}
        placeholder="What are you building, learning, or celebrating?"
        className="post-composer-textarea"
      />

      {files.length > 0 && (
        <div className="post-image-preview-list">
          {files.map((file, index) => (
            <ImagePreview key={`${file.name}-${file.size}-${file.lastModified}`} file={file} onRemove={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} />
          ))}
        </div>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>}

      <div className="post-composer-footer">
        <label className="btn btn-secondary min-h-10 cursor-pointer px-3 text-sm">
          <FaImage className="text-cyan-200" />
          Add photos
          <input
            key={fileInputKey}
            type="file"
            accept={ACCEPTED_IMAGES}
            multiple
            className="sr-only"
            onChange={handleFileChange}
          />
        </label>
        <span className="text-xs text-slate-500">Up to 4 photos · 8 MB each</span>
        <button type="submit" disabled={submitting} className="btn btn-primary min-h-10 px-4 text-sm">
          <FaPaperPlane />
          {submitting ? "Publishing..." : "Post"}
        </button>
      </div>
    </form>
  );
}

export default PostComposer;
