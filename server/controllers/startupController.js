const Startup = require("../models/Startup");

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

const getStartups = async (req, res) => {
  try {
    const startups = await Startup.find(publishedStartupFilter)
      .populate(
        "founder",
        "name email photoURL role roles verification location"
      )
      .populate(
        "teamMembers",
        "name email photoURL role roles verification"
      );

    res.json(startups);

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
  getMyStartups,
  getStartupById,
  updateStartup,
  deleteStartup,
  removeTeamMember,
};
