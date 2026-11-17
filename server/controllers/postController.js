const mongoose = require("mongoose");
const Post = require("../models/Post");
const PostReaction = require("../models/PostReaction");
const PostComment = require("../models/PostComment");
const Startup = require("../models/Startup");
const User = require("../models/User");
const { canManageStartup } = require("../utils/startupAccess");

const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
]);

const promotions = [
  {
    _id: "founderverse-promo-founders",
    kind: "promotion",
    brand: "FounderVerse",
    label: "Sponsored · FounderVerse",
    title: "Your next great collaborator is already building.",
    body: "Meet founders, investors, mentors, and makers who are ready to turn momentum into something real.",
    actionLabel: "Meet the community",
    actionUrl: "/founders",
    accent: "cyan",
  },
  {
    _id: "founderverse-promo-startups",
    kind: "promotion",
    brand: "FounderVerse",
    label: "Sponsored · FounderVerse",
    title: "Give your startup a place to grow.",
    body: "Share what you are building, find teammates, and make your next milestone easier to reach.",
    actionLabel: "Explore startups",
    actionUrl: "/startups",
    accent: "mint",
  },
  {
    _id: "founderverse-promo-profile",
    kind: "promotion",
    brand: "FounderVerse",
    label: "Sponsored · FounderVerse",
    title: "Make your next introduction count.",
    body: "Show the community what you care about and find people who can help move your idea forward.",
    actionLabel: "Build your profile",
    actionUrl: "/register",
    accent: "violet",
  },
];

const cleanText = (value, maxLength = 1200) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const parseLimit = (value, fallback = 12) =>
  Math.min(Math.max(Number(value) || fallback, 1), 20);

const parseExcludedIds = (value) => {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .slice(0, 160)
    .map((id) => new mongoose.Types.ObjectId(id));
};

const cleanImages = (items, firebaseUid) => {
  if (items === undefined) return [];
  if (!Array.isArray(items) || items.length > MAX_IMAGES) return null;

  const images = [];
  for (const item of items) {
    const url = cleanText(item?.url, 1000);
    const name = cleanText(item?.name, 200);
    const contentType = cleanText(item?.contentType, 120).toLowerCase();
    const size = Number(item?.size);
    let parsedUrl;
    let decodedPath;

    try {
      parsedUrl = new URL(url);
      decodedPath = decodeURIComponent(parsedUrl.pathname);
    } catch {
      return null;
    }

    if (
      parsedUrl.protocol !== "https:" ||
      !["firebasestorage.googleapis.com", "storage.googleapis.com"].includes(parsedUrl.hostname) ||
      !firebaseUid ||
      !decodedPath.includes(`/o/posts/${firebaseUid}/`) ||
      !name ||
      !ALLOWED_IMAGE_TYPES.has(contentType) ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > MAX_IMAGE_SIZE
    ) {
      return null;
    }

    images.push({ url, name, contentType, size });
  }

  return images;
};

const loadPostCards = async (ids, req) => {
  if (!ids.length) return [];

  const posts = await Post.find({ _id: { $in: ids } })
    .populate("author", "name photoURL role roles verification")
    .populate("startup", "title logo verificationStatus founder")
    .lean();
  const postById = new Map(posts.map((post) => [post._id.toString(), post]));
  const postIds = ids.map((id) => new mongoose.Types.ObjectId(id));

  const [reactionCounts, commentCounts, viewerReactions] = await Promise.all([
    PostReaction.aggregate([
      { $match: { post: { $in: postIds } } },
      {
        $group: {
          _id: { post: "$post", reaction: "$reaction" },
          count: { $sum: 1 },
        },
      },
    ]),
    PostComment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: "$post", count: { $sum: 1 } } },
    ]),
    req.user
      ? PostReaction.find({ post: { $in: postIds }, user: req.user.id }).lean()
      : [],
  ]);

  const countsByPost = new Map();
  reactionCounts.forEach((item) => {
    const id = item._id.post.toString();
    const counts = countsByPost.get(id) || { like: 0, dislike: 0 };
    counts[item._id.reaction] = item.count;
    countsByPost.set(id, counts);
  });
  const commentsByPost = new Map(commentCounts.map((item) => [item._id.toString(), item.count]));
  const viewerReactionByPost = new Map(viewerReactions.map((item) => [item.post.toString(), item.reaction]));

  return ids
    .map((id) => postById.get(id.toString()))
    .filter(Boolean)
    .map((post) => {
      const postId = post._id.toString();
      return {
        ...post,
        kind: "post",
        likeCount: countsByPost.get(postId)?.like || 0,
        dislikeCount: countsByPost.get(postId)?.dislike || 0,
        commentCount: commentsByPost.get(postId) || 0,
        myReaction: viewerReactionByPost.get(postId) || null,
      };
    });
};

const insertPromotion = (posts) => {
  const promotion = promotions[Math.floor(Math.random() * promotions.length)];
  const items = [...posts];
  const lower = items.length > 4 ? 3 : 0;
  const upper = items.length > 4 ? Math.min(items.length, 7) : items.length;
  const index = lower + Math.floor(Math.random() * (upper - lower + 1));
  items.splice(index, 0, promotion);
  return items;
};

const getFeed = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const excludedIds = parseExcludedIds(req.query.exclude);
    const [activeUsers, visibleStartups] = await Promise.all([
      User.find({ accountStatus: { $ne: "suspended" } }).distinct("_id"),
      Startup.find({
        $or: [{ moderationStatus: "published" }, { moderationStatus: { $exists: false } }],
      }).distinct("_id"),
    ]);

    const query = {
      author: { $in: activeUsers },
      _id: { $nin: excludedIds },
      $or: [
        { startup: null },
        ...(visibleStartups.length ? [{ startup: { $in: visibleStartups } }] : []),
      ],
    };
    const [sample, totalRemaining] = await Promise.all([
      Post.aggregate([{ $match: query }, { $sample: { size: limit } }]),
      Post.countDocuments(query),
    ]);
    const posts = await loadPostCards(sample.map((post) => post._id), req);

    res.json({
      items: insertPromotion(posts),
      hasMore: totalRemaining > posts.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTimeline = async (req, res, subjectType) => {
  try {
    const subjectId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid timeline" });
    }

    if (subjectType === "user") {
      const user = await User.findOne({ _id: subjectId, accountStatus: { $ne: "suspended" } }).select("_id");
      if (!user) return res.status(404).json({ message: "Profile not found" });
    } else {
      const startup = await Startup.findOne({
        _id: subjectId,
        $or: [
          { moderationStatus: "published" },
          { moderationStatus: "banned" },
          { moderationStatus: { $exists: false } },
        ],
      }).select("_id");
      if (!startup) return res.status(404).json({ message: "Startup not found" });
    }

    const limit = parseLimit(req.query.limit, 10);
    const excludedIds = parseExcludedIds(req.query.exclude);
    const query = {
      [subjectType === "user" ? "author" : "startup"]: subjectId,
      _id: { $nin: excludedIds },
    };
    const [posts, totalRemaining] = await Promise.all([
      Post.find(query).sort({ createdAt: -1 }).limit(limit).select("_id").lean(),
      Post.countDocuments(query),
    ]);
    const loadedPosts = await loadPostCards(posts.map((post) => post._id), req);

    res.json({ posts: loadedPosts, hasMore: totalRemaining > loadedPosts.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserPosts = (req, res) => getTimeline(req, res, "user");
const getStartupPosts = (req, res) => getTimeline(req, res, "startup");

const createPost = async (req, res) => {
  try {
    const author = await User.findById(req.user.id);
    if (!author) return res.status(404).json({ message: "Account not found" });

    const caption = cleanText(req.body.caption, 2800);
    const images = cleanImages(req.body.images, author.firebaseUid);
    if (!images) {
      return res.status(400).json({ message: "Attach up to 4 supported images from FounderVerse storage (8 MB each)" });
    }
    if (!caption && images.length === 0) {
      return res.status(400).json({ message: "Write a caption or attach a photo" });
    }

    let startup = null;
    if (req.body.startupId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.startupId)) {
        return res.status(400).json({ message: "Choose a valid startup" });
      }
      startup = await Startup.findById(req.body.startupId);
      if (!startup) {
        return res.status(404).json({ message: "Startup not found" });
      }
      if (!canManageStartup(startup, req.user.id)) {
        return res.status(403).json({ message: "Only the startup founder or a startup admin can post for this startup." });
      }
      if (startup.moderationStatus === "banned") {
        return res.status(403).json({ message: "A temporarily banned startup cannot publish posts" });
      }
    }

    const post = await Post.create({
      author: req.user.id,
      startup: startup?._id || null,
      caption,
      images,
    });
    const [created] = await loadPostCards([post._id], req);
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const reaction = cleanText(req.body.reaction, 16).toLowerCase();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post" });
    }
    if (!["like", "dislike"].includes(reaction)) {
      return res.status(400).json({ message: "Choose like or dislike" });
    }
    const post = await Post.findById(id).select("_id");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const existing = await PostReaction.findOne({ post: id, user: req.user.id });
    let myReaction = reaction;

    if (existing?.reaction === reaction) {
      await PostReaction.deleteOne({ _id: existing._id });
      myReaction = null;
    } else if (existing) {
      existing.reaction = reaction;
      await existing.save();
    } else {
      try {
        await PostReaction.create({ post: id, user: req.user.id, reaction });
      } catch (error) {
        if (error.code !== 11000) throw error;
        await PostReaction.updateOne({ post: id, user: req.user.id }, { $set: { reaction } });
      }
    }

    const counts = await PostReaction.aggregate([
      { $match: { post: post._id } },
      { $group: { _id: "$reaction", count: { $sum: 1 } } },
    ]);
    const countsByReaction = Object.fromEntries(counts.map((item) => [item._id, item.count]));
    res.json({
      likeCount: countsByReaction.like || 0,
      dislikeCount: countsByReaction.dislike || 0,
      myReaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getComments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post" });
    }
    const post = await Post.findById(id).select("_id");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 40);
    const [comments, total] = await Promise.all([
      PostComment.find({ post: id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("author", "name photoURL role roles verification"),
      PostComment.countDocuments({ post: id }),
    ]);
    res.json({ comments: comments.reverse(), page, hasMore: page * limit < total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const message = cleanText(req.body.message, 1200);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid post" });
    }
    if (!message) return res.status(400).json({ message: "Write a comment first" });
    const post = await Post.findById(id).select("_id");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await PostComment.create({ post: id, author: req.user.id, message });
    await comment.populate("author", "name photoURL role roles verification");
    res.status(201).json({ comment, commentCount: await PostComment.countDocuments({ post: id }) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFeed,
  getUserPosts,
  getStartupPosts,
  createPost,
  toggleReaction,
  getComments,
  addComment,
};
