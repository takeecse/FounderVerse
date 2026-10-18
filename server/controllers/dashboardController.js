const Startup = require("../models/Startup");
const Request = require("../models/Request");
const User = require("../models/User");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const [
      startupCount,
      receivedRequests,
      sentRequests,
      pendingReceivedRequests,
      acceptedRequests,
      acceptedSentRequests,
      openStartupsCount,
      fundingOpportunities,
      user,
    ] = await Promise.all([
      Startup.countDocuments({ founder: userId }),
      Request.countDocuments({ receiver: userId }),
      Request.countDocuments({ sender: userId }),
      Request.countDocuments({
        receiver: userId,
        status: "pending",
      }),
      Request.countDocuments({
        receiver: userId,
        status: "accepted",
      }),
      Request.countDocuments({
        sender: userId,
        status: "accepted",
      }),
      Startup.countDocuments({
        status: "Open",
        isHiring: true,
        $or: [
          { moderationStatus: "published" },
          { moderationStatus: { $exists: false } },
        ],
      }),
      Startup.countDocuments({
        fundingNeeded: { $nin: ["", null] },
        $or: [
          { moderationStatus: "published" },
          { moderationStatus: { $exists: false } },
        ],
      }),
      User.findById(userId).select("executionScore connections"),
    ]);

    res.json({
      startupCount,
      receivedRequests,
      sentRequests,
      pendingReceivedRequests,
      acceptedRequests,
      acceptedSentRequests,
      activeConnections: user.connections?.length || 0,
      openStartupsCount,
      fundingOpportunities,
      executionScore:
        user?.executionScore || 0,
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
