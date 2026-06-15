const Startup = require("../models/Startup");
const Request = require("../models/Request");
const User = require("../models/User");

const getDashboardStats = async (req, res) => {
  try {
    const startupCount = await Startup.countDocuments({
      founder: req.user.id,
    });

    const receivedRequests =
      await Request.countDocuments({
        receiver: req.user.id,
      });

    const acceptedRequests =
      await Request.countDocuments({
        receiver: req.user.id,
        status: "accepted",
      });

    const user = await User.findById(
      req.user.id
    );

    res.json({
      startupCount,
      receivedRequests,
      acceptedRequests,
      executionScore:
        user.executionScore || 0,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};