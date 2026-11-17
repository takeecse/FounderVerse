const Startup = require("../models/Startup");
const User = require("../models/User");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const { rankStartups, hasProfileData } = require("../utils/recommender");
const {
  canManageStartup,
  getStartupMembership,
  isStartupAdmin,
  isStartupFounder,
} = require("../utils/startupAccess");

const publishedStartupFilter = {
  $or: [
    { moderationStatus: "published" },
    { moderationStatus: { $exists: false } },
  ],
};

const discoverableStartupFilter = {
  $or: [
    { moderationStatus: "published" },
    { moderationStatus: "banned" },
    { moderationStatus: { $exists: false } },
  ],
};

const purgeExpiredBannedStartups = async (io) => {
  const expiredStartups = await Startup.find({
    moderationStatus: "banned",
    appealDeadline: { $lte: new Date() },
    "appeal.status": { $ne: "pending" },
  }).select("_id title founder");

  if (!expiredStartups.length) return 0;

  await Promise.all(expiredStartups.map(async (startup) => {
    try {
      const notification = await Notification.create({
        user: startup.founder,
        title: "Startup permanently removed",
        message: `${startup.title} reached the end of its 30-day appeal period and has been permanently removed from FounderVerse.`,
      });
      io?.to(`user:${startup.founder}`).emit("notification:new", {
        _id: notification._id.toString(),
        user: startup.founder.toString(),
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      });
    } catch (error) {
      console.error("Could not notify founder before startup removal:", error.message);
    }
  }));

  const result = await Startup.deleteMany({
    _id: { $in: expiredStartups.map((startup) => startup._id) },
    moderationStatus: "banned",
    appealDeadline: { $lte: new Date() },
    "appeal.status": { $ne: "pending" },
  });

  return result.deletedCount || 0;
};

const createStartup = async (req, res) => {
  try {
    const {
      title,
      tagline,
      description,
      industry,
      techStack,
      lookingFor,
      website,
      location,
      stage,
      fundingStatus,
      fundingNeeded,
      isHiring,
      teamSize,
      logo,
    } = req.body;

    const creator = await User.findById(req.user.id).select("_id");
    if (!creator) {
      return res.status(404).json({ message: "Account not found" });
    }

    const startup = await Startup.create({
      title,
      tagline,
      description,
      industry,
      techStack,
      lookingFor,
      teamSize,
      logo,

      website,
      location,
      stage,
      fundingStatus,
      fundingNeeded,
      isHiring,

      founder: req.user.id,
    });

    await User.updateOne(
      { _id: creator._id },
      { $addToSet: { roles: "Founder" } }
    );

    res.status(201).json(startup);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const FOUNDER_FIELDS =
  "name username email photoURL role roles verification location";
const MEMBER_FIELDS = "name username email photoURL role roles verification";

// Startup data + the "why" fields shown on the card
const toRecommendation = ({ startup, score, matchedTerms }) => ({
  ...startup,
  matchScore: Math.round(score * 100),
  matchedTerms,
});

// Escape special characters so user text is treated as plain text, not a regex
const escapeRegex = (text) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Accept only a short string from the query (ignore arrays/objects)
const getTextParam = (value) =>
  typeof value === "string" ? value.trim().slice(0, 100) : "";

const getStartups = async (req, res) => {
  try {
    const q = getTextParam(req.query.q);
    const industry = getTextParam(req.query.industry);
    const stage = getTextParam(req.query.stage);
    const hiring = req.query.hiring === "true";

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      30
    );

    // Start with discoverable startups, then add each filter.
    const conditions = [discoverableStartupFilter];

    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");

      // The text matches if it is found in ANY of these fields
      conditions.push({
        $or: [
          { title: regex },
          { tagline: regex },
          { description: regex },
          { industry: regex },
          { techStack: regex },
          { lookingFor: regex },
        ],
      });
    }

    if (industry) {
      conditions.push({
        industry: new RegExp(escapeRegex(industry), "i"),
      });
    }

    if (stage) {
      conditions.push({ stage });
    }

    if (hiring) {
      conditions.push({ isHiring: true });
    }

    const filter = { $and: conditions };

    // Logged-in users can ask for "best match" ordering:
    // load the matching startups, rank them against the user's profile,
    // then cut out the current page.
    if (req.query.sort === "relevance" && req.user) {
      const allMatches = await Startup.find(filter)
        .select("-appeal")
        .populate("founder", FOUNDER_FIELDS)
        .populate("teamMembers", MEMBER_FIELDS)
        .lean();

      const ranked = rankStartups(req.user.profile, allMatches);
      const rankedTotal = ranked.length;

      const pageItems = ranked
        .slice((page - 1) * limit, page * limit)
        .map(toRecommendation);

      return res.json({
        startups: pageItems,
        total: rankedTotal,
        page,
        totalPages: Math.max(Math.ceil(rankedTotal / limit), 1),
      });
    }

    const total = await Startup.countDocuments(filter);

    const startups = await Startup.find(filter)
      .select("-appeal")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(
        "founder",
        "name email photoURL role roles verification location"
      )
      .populate(
        "teamMembers",
        "name email photoURL role roles verification"
      );

    res.json({
      startups,
      total,
      page,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Top startups for the logged-in user, based on their profile
const getRecommendedStartups = async (req, res) => {
  try {
    const user = req.user.profile;

    // Do not recommend the user's own startups or ones they already joined
    const startups = await Startup.find({
      $and: [
        publishedStartupFilter,
        { founder: { $ne: req.user.id } },
        { teamMembers: { $ne: req.user.id } },
      ],
    })
      .select("-appeal")
      .populate("founder", FOUNDER_FIELDS)
      .populate("teamMembers", MEMBER_FIELDS)
      .lean();

    const recommended = rankStartups(user, startups)
      .filter((item) => item.score > 0)
      .slice(0, 6)
      .map(toRecommendation);

    res.json({
      startups: recommended,
      hasProfileData: hasProfileData(user),
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getMyStartups = async (req, res) => {
  try {
    const startups = await Startup.find({
      $or: [
        { founder: req.user.id },
        { teamMemberRoles: { $elemMatch: { user: req.user.id, isAdmin: true } } },
      ],
    });

    res.json(startups.map((startup) => {
      const value = startup.toObject();
      value.viewerPermissions = {
        isFounder: isStartupFounder(startup, req.user.id),
        isAdmin: isStartupAdmin(startup, req.user.id),
        canManage: canManageStartup(startup, req.user.id),
      };
      if (value.appeal) delete value.appeal.seenBy;
      return value;
    }));

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getStartupById = async (req, res) => {
  try {
    const startup = await Startup.findOne({
      _id: req.params.id,
      ...discoverableStartupFilter,
    }).populate(
      "founder",
      `
  name
  username
  email
  photoURL
  role
  roles
  verification
  location
  github
  linkedin
  `
    )
      .populate(
        "teamMembers",
        `
  name
  username
  email
  photoURL
  role
  roles
  verification
  location
  github
  linkedin
  `
      );

    if (!startup) {
      return res.status(404).json({
        message: "Startup not found",
      });
    }

    const value = startup.toObject();
    const founderId = startup.founder?._id?.toString() || startup.founder?.toString();
    const viewerIsFounder = req.user?.id === founderId;
    value.viewerPermissions = {
      isFounder: viewerIsFounder,
      isAdmin: isStartupAdmin(startup, req.user?.id),
      canManage: canManageStartup(startup, req.user?.id),
    };
    if (!viewerIsFounder) {
      delete value.appeal;
    } else if (value.appeal) {
      delete value.appeal.seenBy;
    }
    res.json(value);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(
      req.params.id
    );

    if (!startup) {
      return res.status(404).json({
        message: "Startup not found",
      });
    }

    if (!canManageStartup(startup, req.user.id)) {
      return res.status(403).json({ message: "Only this startup's founder or startup admin can edit it." });
    }

    if (startup.moderationStatus === "banned") {
      return res.status(403).json({
        message: "This startup is temporarily banned and cannot be edited while its appeal is reviewed.",
      });
    }

    startup.title =
      req.body.title ?? startup.title;

    startup.tagline =
      req.body.tagline ?? startup.tagline;

    startup.description =
      req.body.description ??
      startup.description;

    startup.industry =
      req.body.industry ??
      startup.industry;

    startup.techStack =
      req.body.techStack ??
      startup.techStack;

    startup.lookingFor =
      req.body.lookingFor ??
      startup.lookingFor;

    startup.website =
      req.body.website ??
      startup.website;

    startup.location =
      req.body.location ??
      startup.location;

    startup.stage =
      req.body.stage ??
      startup.stage;

    startup.fundingStatus =
      req.body.fundingStatus ??
      startup.fundingStatus;

    startup.fundingNeeded =
      req.body.fundingNeeded ??
      startup.fundingNeeded;

    startup.isHiring =
      req.body.isHiring ??
      startup.isHiring;

    startup.teamSize =
      req.body.teamSize ??
      startup.teamSize;

    startup.logo =
      req.body.logo ??
      startup.logo;

    const updatedStartup =
      await startup.save();

    res.json(updatedStartup);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const submitStartupAppeal = async (req, res) => {
  try {
    const message = typeof req.body.message === "string"
      ? req.body.message.trim().slice(0, 1200)
      : "";

    if (!message) {
      return res.status(400).json({ message: "Write a message explaining your appeal" });
    }

    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.founder.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the startup founder can appeal this decision" });
    }
    if (startup.moderationStatus !== "banned") {
      return res.status(400).json({ message: "Only a temporarily banned startup can be appealed" });
    }
    if (startup.appealDeadline && startup.appealDeadline <= new Date()) {
      return res.status(410).json({ message: "The 30-day appeal period has ended" });
    }
    if (startup.appeal?.status === "pending") {
      return res.status(409).json({ message: "An appeal is already awaiting review" });
    }

    startup.appeal = {
      message,
      status: "pending",
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      resolutionNote: "",
      seenBy: [],
    };
    await startup.save();

    const confirmation = await Notification.create({
      user: req.user.id,
      title: "Appeal submitted",
      message: `Your appeal for ${startup.title} has been sent to the moderation team. We’ll notify you when it is reviewed.`,
    });
    req.app.get("io")?.to(`user:${req.user.id}`).emit("notification:new", {
      _id: confirmation._id.toString(),
      user: req.user.id,
      title: confirmation.title,
      message: confirmation.message,
      isRead: confirmation.isRead,
      createdAt: confirmation.createdAt,
      updatedAt: confirmation.updatedAt,
    });
    req.app.get("io")?.to("admins").emit("admin:inbox-updated");

    res.status(201).json(startup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(
      req.params.id
    );

    if (!startup) {
      return res.status(404).json({
        message: "Startup not found",
      });
    }

    if (!isStartupFounder(startup, req.user.id)) {
      return res.status(403).json({ message: "Only the startup founder can delete it." });
    }

    await startup.deleteOne();

    res.json({
      message: "Startup deleted",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const removeTeamMember = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.memberId)) {
      return res.status(400).json({ message: "Invalid team member" });
    }

    const startup = await Startup.findById(
      req.params.id
    );

    if (!startup) {
      return res.status(404).json({
        message: "Startup not found",
      });
    }

    const actorIsFounder = isStartupFounder(startup, req.user.id);
    if (!canManageStartup(startup, req.user.id)) {
      return res.status(403).json({ message: "Only this startup's founder or startup admin can manage its team." });
    }

    const targetMembership = getStartupMembership(startup, req.params.memberId);
    if (targetMembership?.isAdmin && !actorIsFounder) {
      return res.status(403).json({ message: "Only the founder can remove a startup admin." });
    }

    startup.teamMembers =
      startup.teamMembers.filter(
        (member) =>
          member.toString() !==
          req.params.memberId
      );
    startup.teamMemberRoles = startup.teamMemberRoles.filter(
      (membership) => membership.user.toString() !== req.params.memberId
    );

    await startup.save();

    res.json({
      message: "Member removed",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateTeamMember = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.memberId)) {
      return res.status(400).json({ message: "Invalid team member" });
    }

    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.moderationStatus === "banned") {
      return res.status(403).json({ message: "A temporarily banned startup team cannot be changed." });
    }

    const actorIsFounder = isStartupFounder(startup, req.user.id);
    if (!canManageStartup(startup, req.user.id)) {
      return res.status(403).json({ message: "Only this startup's founder or startup admin can manage its team." });
    }

    const memberId = req.params.memberId;
    if (!startup.teamMembers.some((member) => member.toString() === memberId)) {
      return res.status(404).json({ message: "That person is not on this startup team." });
    }

    let membership = getStartupMembership(startup, memberId);
    if (!membership) {
      startup.teamMemberRoles.push({ user: memberId, role: "Member", addedBy: req.user.id });
      membership = getStartupMembership(startup, memberId);
    }

    if (req.body.role !== undefined) {
      const role = typeof req.body.role === "string" ? req.body.role.trim().slice(0, 60) : "";
      if (!role) return res.status(400).json({ message: "Enter a role for this team member." });
      if (membership.isAdmin && !actorIsFounder) {
        return res.status(403).json({ message: "Only the founder can change a startup admin's role." });
      }
      membership.role = role;
    }

    if (req.body.isAdmin !== undefined) {
      if (!actorIsFounder) {
        return res.status(403).json({ message: "Only the founder can grant or remove startup admin access." });
      }
      if (typeof req.body.isAdmin !== "boolean") {
        return res.status(400).json({ message: "Admin access must be true or false." });
      }
      membership.isAdmin = req.body.isAdmin;
    }

    await startup.save();
    res.json({
      teamMemberRoles: startup.teamMemberRoles.map((item) => ({
        user: item.user.toString(),
        role: item.role || "Member",
        isAdmin: Boolean(item.isAdmin),
        addedAt: item.addedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStartup,
  getStartups,
  getRecommendedStartups,
  getMyStartups,
  getStartupById,
  updateStartup,
  deleteStartup,
  removeTeamMember,
  updateTeamMember,
  submitStartupAppeal,
  purgeExpiredBannedStartups,
};
