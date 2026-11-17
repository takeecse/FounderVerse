import { useCallback, useEffect, useRef, useState } from "react";
import { FaArrowRotateRight, FaRegNewspaper } from "react-icons/fa6";
import { getStartupPosts, getUserPosts } from "../api/postApi";
import PostCard from "./PostCard";

function PostTimeline({ type, id, composer = null }) {
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [timelineVersion, setTimelineVersion] = useState(0);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);

  const loadPosts = useCallback(async ({ append = false, currentPosts = [] } = {}) => {
    const requestId = requestSequence.current + 1;
    requestSequence.current = requestId;
    const exclude = append ? currentPosts.map((post) => post._id) : [];
    try {
      setError("");
      if (append) setLoadingMore(true);
      else setLoading(true);
      const response = type === "startup"
        ? await getStartupPosts(id, exclude)
        : await getUserPosts(id, exclude);
      if (requestId !== requestSequence.current) return;
      setPosts((current) => append
        ? [...current, ...(response.data.posts || []).filter((post) => !current.some((item) => item._id === post._id))]
        : response.data.posts || []);
      if (!append) setTimelineVersion((current) => current + 1);
      setHasMore(Boolean(response.data.hasMore));
    } catch (requestError) {
      if (requestId === requestSequence.current) {
        setError(requestError.response?.data?.message || "Could not load posts.");
      }
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [id, type]);

  useEffect(() => {
    loadPosts();
    return () => { requestSequence.current += 1; };
  }, [loadPosts]);

  const handlePostCreated = (post) => {
    setPosts((current) => [post, ...current.filter((item) => item._id !== post._id)]);
  };

  const handlePostChange = (postId, changes) => {
    setPosts((current) => current.map((post) => post._id === postId ? { ...post, ...changes } : post));
  };

  return (
    <section className="post-timeline">
      <div className="post-timeline-heading">
        <div>
          <p className="eyebrow">Community updates</p>
          <h2 className="text-2xl font-black">Posts</h2>
        </div>
        <button type="button" onClick={() => loadPosts()} disabled={loading} className="post-timeline-refresh" aria-label="Refresh posts">
          <FaArrowRotateRight className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {composer && <div className="mb-5">{composer(handlePostCreated)}</div>}

      {loading && posts.length === 0 && <div className="post-feed-loading glass-panel">Loading posts...</div>}
      {error && <p role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-sm text-rose-200">{error}</p>}
      {!loading && posts.length === 0 && !error && (
        <div className="post-feed-empty glass-panel">
          <FaRegNewspaper />
          <h3 className="mt-4 text-lg font-black">No posts here yet</h3>
          <p className="mt-2 text-sm text-slate-400">Share an update to start this timeline.</p>
        </div>
      )}

      <div className="grid gap-5">
        {posts.map((post) => <PostCard key={`${post._id}-${timelineVersion}`} post={post} onPostChange={handlePostChange} />)}
      </div>

      {hasMore && posts.length > 0 && (
        <button type="button" onClick={() => loadPosts({ append: true, currentPosts: posts })} disabled={loadingMore} className="post-load-more">
          {loadingMore ? "Loading..." : "Load more posts"}
        </button>
      )}
    </section>
  );
}

export default PostTimeline;
