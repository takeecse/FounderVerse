import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRotateRight, FaBullhorn, FaCircleNodes, FaCompass, FaStar } from "react-icons/fa6";
import { getFeedPosts } from "../api/postApi";
import { isAuthenticated } from "../utils/session";
import PostCard from "./PostCard";
import PostComposer from "./PostComposer";

function PromotionCard({ promotion }) {
  const accent = promotion.accent === "mint"
    ? "post-promo-mint"
    : promotion.accent === "violet"
      ? "post-promo-violet"
      : "post-promo-cyan";

  return (
    <article className={`post-promo-card ${accent}`}>
      <div className="post-promo-topline">
        <span><FaBullhorn /> {promotion.label}</span>
        <span className="post-promo-spark"><FaStar /></span>
      </div>
      <div className="post-promo-mark">FV</div>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-white/70">FounderVerse Spotlight</p>
      <h2 className="mt-3 text-2xl font-black leading-tight text-white">{promotion.title}</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">{promotion.body}</p>
      <Link to={promotion.actionUrl} className="post-promo-action">
        {promotion.actionLabel} <FaCompass />
      </Link>
      <div className="post-promo-orb" aria-hidden="true" />
    </article>
  );
}

function PostFeed() {
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);
  const [error, setError] = useState("");
  const hasCommunityPosts = items.some((item) => item.kind === "post");

  const loadFeed = useCallback(async ({ append = false, currentItems = [] } = {}) => {
    const postIds = append
      ? currentItems.filter((item) => item.kind === "post").map((item) => item._id)
      : [];
    try {
      setError("");
      if (append) setLoadingMore(true);
      else setLoading(true);
      const response = await getFeedPosts(postIds);
      setItems((current) => {
        if (!append) return response.data.items || [];
        const existing = new Set(current.map((item) => item._id));
        return [...current, ...(response.data.items || []).filter((item) => !existing.has(item._id))];
      });
      if (!append) setFeedVersion((current) => current + 1);
      setHasMore(Boolean(response.data.hasMore));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load the community feed. Try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handlePostCreated = (post) => {
    setItems((current) => [post, ...current.filter((item) => item._id !== post._id)]);
  };

  const handlePostChange = (postId, changes) => {
    setItems((current) => current.map((item) => item._id === postId ? { ...item, ...changes } : item));
  };

  return (
    <section className="post-feed-section page-shell page-wide">
      <div className="post-feed-heading">
        <div>
          <p className="eyebrow">The builder feed</p>
          <h1 className="page-title">Ideas in motion.</h1>
          <p className="page-subtitle">See what founders are learning, launching, and looking for across FounderVerse.</p>
        </div>
        <button type="button" onClick={() => loadFeed()} disabled={loading} className="btn btn-secondary">
          <FaArrowRotateRight className={loading ? "animate-spin" : ""} />
          Shuffle feed
        </button>
      </div>

      <div className="post-feed-layout">
        <div className="post-feed-stream">
          {isAuthenticated() ? (
            <PostComposer onPosted={handlePostCreated} />
          ) : (
            <section className="post-guest-card glass-panel">
              <div className="post-guest-icon"><FaCircleNodes /></div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-black">Building something? Share it here.</h2>
                <p className="mt-1 text-sm text-slate-400">Join the community to post updates, add photos, and meet your next collaborator.</p>
              </div>
              <Link to="/register" className="btn btn-primary">Join FounderVerse</Link>
            </section>
          )}

          {loading && items.length === 0 && (
            <div className="post-feed-loading glass-panel">Finding fresh updates...</div>
          )}
          {error && (
            <div className="glass-panel p-5 text-center">
              <p className="text-sm text-rose-200">{error}</p>
              <button type="button" onClick={() => loadFeed()} className="btn btn-secondary mt-3">Try again</button>
            </div>
          )}

          {!loading && !hasCommunityPosts && !error && (
            <div className="post-feed-empty glass-panel">
              <FaCircleNodes />
              <h2 className="mt-4 text-xl font-black">A fresh page for new ideas</h2>
              <p className="mt-2 text-sm text-slate-400">Community updates will appear here as people share what they are building.</p>
            </div>
          )}

          {items.map((item) => item.kind === "promotion" ? (
            <PromotionCard key={item._id} promotion={item} />
          ) : (
            <PostCard key={`${item._id}-${feedVersion}`} post={item} onPostChange={handlePostChange} />
          ))}

          {hasMore && items.length > 0 && (
            <button type="button" onClick={() => loadFeed({ append: true, currentItems: items })} disabled={loadingMore} className="post-load-more">
              {loadingMore ? "Finding more updates..." : "Load more updates"}
            </button>
          )}
        </div>

        <aside className="post-feed-aside">
          <section className="glass-panel p-5">
            <p className="eyebrow">Built for momentum</p>
            <h2 className="text-xl font-black">Build in public. Find your people.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Share a milestone, ask for feedback, or show the community what you are looking for.</p>
            <div className="mt-5 grid gap-2">
              <Link to="/startups" className="btn btn-secondary justify-start">Explore startups</Link>
              <Link to="/founders" className="btn btn-secondary justify-start">Meet the builders</Link>
            </div>
          </section>
          <p className="px-2 text-xs leading-5 text-slate-600">FounderVerse promotions are platform announcements. Your feed refreshes with a new mix of community posts.</p>
        </aside>
      </div>
    </section>
  );
}

export default PostFeed;
