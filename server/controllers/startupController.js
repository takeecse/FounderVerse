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

module.exports = {
  createStartup,
};