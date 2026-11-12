const Startup = require("../models/Startup");
const { rankStartups, hasProfileData } = require("../utils/recommender");

const publishedStartupFilter = {
  $or: [
    { moderationStatus: "published" },
    { moderationStatus: { $exists: false } },
  ],
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

    res.status(201).json(startup);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const FOUNDER_FIELDS =
  "name email photoURL role roles verification location";
const MEMBER_FIELDS = "name email photoURL role roles verification";

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

    // Start with "only published startups", then add each filter
    const conditions = [publishedStartupFilter];

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
      founder: req.user.id,
    });

    res.json(startups);

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
      ...publishedStartupFilter,
    }).populate(
      "founder",
      `
  name
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

    res.json(startup);

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

    if (
      startup.founder.toString() !==
      req.user.id
    ) {
      return res.status(401).json({
        message: "Not authorized",
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

    if (
      startup.founder.toString() !==
      req.user.id
    ) {
      return res.status(401).json({
        message: "Not authorized",
      });
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
    const startup = await Startup.findById(
      req.params.id
    );

    if (!startup) {
      return res.status(404).json({
        message: "Startup not found",
      });
    }

    if (
      startup.founder.toString() !==
      req.user.id
    ) {
      return res.status(401).json({
        message: "Not authorized",
      });
    }

    startup.teamMembers =
      startup.teamMembers.filter(
        (member) =>
          member.toString() !==
          req.params.memberId
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

module.exports = {
  createStartup,
  getStartups,
  getRecommendedStartups,
  getMyStartups,
  getStartupById,
  updateStartup,
  deleteStartup,
  removeTeamMember,
};
