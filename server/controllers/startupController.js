const Startup = require("../models/Startup");

const createStartup = async (req, res) => {
  try {
    const {
      title,
      tagline,
      description,
      industry,
      techStack,
      lookingFor,
    } = req.body;

    const startup = await Startup.create({
      title,
      tagline,
      description,
      industry,
      techStack,
      lookingFor,
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
    const startups = await Startup.find()
      .populate("founder", "name email");

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
    const startup = await Startup.findById(
      req.params.id
    ).populate(
      "founder",
      "name email github linkedin"
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

module.exports = {
  createStartup,
  getStartups,
  getMyStartups,
  getStartupById,
};