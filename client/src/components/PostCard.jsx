import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaCircleCheck,
  FaComment,
  FaPaperPlane,
  FaThumbsDown,
  FaThumbsUp,
} from "react-icons/fa6";
import {
  addPostComment,
  getPostComments,
  togglePostReaction,
} from "../api/postApi";
import { isAuthenticated } from "../utils/session";
import { isVerifiedForRole, normalizeRoles } from "../utils/roles";

const timeLabel = (value) => {
  const time = new Date(value).getTime();
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
  return new Date(value).toLocaleDateString();
};

function PostCard({ post, onPostChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [reaction, setReaction] = useState(post.myReaction || null);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [dislikeCount, setDislikeCount] = useState(post.dislikeCount || 0);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [reactionBusy, setReactionBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentMessage, setCommentMessage] = useState("");
  const [commentError, setCommentError] = useState("");
  const [reactionError, setReactionError] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const author = post.author;
  const startup = post.startup;
  const identityName = startup?.title || author?.name || "FounderVerse member";
  const identityPhoto = startup?.logo || author?.photoURL;
  const isVerified = startup?.verificationStatus === "verified" ||
    normalizeRoles(author).some((role) => isVerifiedForRole(author, role));

  const requireLogin = () => {
    if (isAuthenticated()) return true;
    navigate("/login", { state: { from: location.pathname } });
    return false;
  };

  const handleReaction = async (nextReaction) => {
    if (!requireLogin() || reactionBusy) return;
    try {
      setReactionError("");
      setReactionBusy(true);
      const response = await togglePostReaction(post._id, nextReaction);
      setReaction(response.data.myReaction);
      setLikeCount(response.data.likeCount);
      setDislikeCount(response.data.dislikeCount);
    } catch (error) {
      setReactionError(error.response?.data?.message || "Could not save your reaction.");
    } finally {
      setReactionBusy(false);
    }
  };

  const loadComments = async (page = 1) => {
    try {
      setCommentsLoading(true);
      const response = await getPostComments(post._id, page);
      setComments((current) => page === 1
        ? response.data.comments
        : [...response.data.comments, ...current]);
      setCommentPage(response.data.page);
      setHasMoreComments(response.data.hasMore);
    } catch (error) {
      setCommentError(error.response?.data?.message || "Could not load comments.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleComments = () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    setCommentError("");
    if (nextOpen && comments.length === 0) loadComments(1);
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    if (!requireLogin() || !commentMessage.trim()) return;
    try {
      setSendingComment(true);
      setCommentError("");
      const response = await addPostComment(post._id, commentMessage.trim());
      setComments((current) => [...current, response.data.comment]);
      setCommentCount(response.data.commentCount);
      setCommentMessage("");
      onPostChange?.(post._id, { commentCount: response.data.commentCount });
    } catch (error) {
      setCommentError(error.response?.data?.message || "Could not add your comment.");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <article className="post-feed-card glass-card">
      <header className="post-card-header">
        <div className="post-card-avatar">
          {identityPhoto ? <img src={identityPhoto} alt="" /> : identityName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {startup ? (
              <Link to={`/startups/${startup._id}`} className="truncate font-black text-white hover:text-cyan-100">{identityName}</Link>
            ) : author?._id ? (
              <Link to={`/founders/${author._id}`} className="truncate font-black text-white hover:text-cyan-100">{identityName}</Link>
            ) : (
              <span className="truncate font-black text-white">{identityName}</span>
            )}
            {isVerified && <FaCircleCheck className="text-sky-300" title="Verified" />}
            <span className="text-xs text-slate-500">· {timeLabel(post.createdAt)}</span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-400">
            {startup ? `Posted by ${author?.name || "the founder"}` : normalizeRoles(author).join(" · ") || "FounderVerse member"}
          </p>
        </div>
      </header>

      {post.caption && <p className="post-card-caption">{post.caption}</p>}

      {post.images?.length > 0 && (
        <div className={`post-card-images ${post.images.length === 1 ? "post-card-images-single" : ""}`}>
          {post.images.map((image) => (
            <a key={image.url} href={image.url} target="_blank" rel="noreferrer" className="post-card-image-link">
              <img src={image.url} alt={image.name || "Post attachment"} loading="lazy" />
            </a>
          ))}
        </div>
      )}

      <div className="post-card-stats">
        <span>{likeCount} likes</span>
        <button type="button" onClick={handleToggleComments}>{commentCount} comments</button>
      </div>

      <div className="post-card-actions">
        <button type="button" aria-pressed={reaction === "like"} disabled={reactionBusy} onClick={() => handleReaction("like")} className={reaction === "like" ? "post-reaction-active" : ""}>
          <FaThumbsUp /> Like <span>{likeCount}</span>
        </button>
        <button type="button" aria-pressed={reaction === "dislike"} disabled={reactionBusy} onClick={() => handleReaction("dislike")} className={reaction === "dislike" ? "post-reaction-active" : ""}>
          <FaThumbsDown /> Dislike <span>{dislikeCount}</span>
        </button>
        <button type="button" aria-expanded={commentsOpen} onClick={handleToggleComments}>
          <FaComment /> Comment
        </button>
      </div>

      {reactionError && <p role="alert" className="post-reaction-error">{reactionError}</p>}

      {commentsOpen && (
        <section className="post-comments-panel" aria-label="Comments">
          {commentsLoading && comments.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">No comments yet. Start the conversation.</p>
          ) : (
            <div className="grid gap-3">
              {comments.map((comment) => (
                <div key={comment._id} className="flex items-start gap-3">
                  <div className="post-comment-avatar">
                    {comment.author?.photoURL
                      ? <img src={comment.author.photoURL} alt="" />
                      : (comment.author?.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{comment.author?.name || "FounderVerse member"}</span>
                      <span className="text-[11px] text-slate-500">{timeLabel(comment.createdAt)}</span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">{comment.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMoreComments && (
            <button type="button" onClick={() => loadComments(commentPage + 1)} disabled={commentsLoading} className="mt-3 text-sm font-bold text-cyan-200 hover:text-cyan-100">
              {commentsLoading ? "Loading..." : "Load earlier comments"}
            </button>
          )}

          {commentError && <p role="alert" className="mt-3 text-sm text-rose-200">{commentError}</p>}

          <form onSubmit={handleCommentSubmit} className="mt-4 flex items-end gap-2">
            <label className="sr-only" htmlFor={`comment-${post._id}`}>Write a comment</label>
            <textarea
              id={`comment-${post._id}`}
              rows={1}
              maxLength={1200}
              value={commentMessage}
              onChange={(event) => setCommentMessage(event.target.value)}
              placeholder={isAuthenticated() ? "Add to the conversation..." : "Sign in to comment..."}
              className="post-comment-input"
            />
            <button type="submit" disabled={sendingComment || !commentMessage.trim()} aria-label="Send comment" className="post-comment-send">
              <FaPaperPlane />
            </button>
          </form>
        </section>
      )}
    </article>
  );
}

export default PostCard;
