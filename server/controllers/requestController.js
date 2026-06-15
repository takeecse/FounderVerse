const Request = require("../models/Request");
const Startup = require("../models/Startup");
const Notification = require("../models/Notification");

const sendRequest = async (req, res) => {
  try {
    const {
      receiverId,
      startupId,
      message,
    } = req.body;

    const request = await Request.create({
      sender: req.user.id,
      receiver: receiverId,
      startup: startupId,
      message,
    });

    await Notification.create({
      user: receiverId,
      title: "New Co-Founder Request",
      message: "You received a new co-founder request.",
    });

    res.status(201).json(request);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getReceivedRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      receiver: req.user.id,
    })
      .populate("sender", "name email")
      .populate("startup", "title");

    res.json(requests);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const acceptRequest = async (req, res) => {
  try {
    const request = await Request.findById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    request.status = "accepted";

    await request.save();

    await Notification.create({
      user: request.sender,
      title: "Request Accepted",
      message: "Your co-founder request was accepted.",
    });

    const updatedStartup =
      await Startup.findByIdAndUpdate(
        request.startup,
        {
          $addToSet: {
            teamMembers: request.receiver,
          },
        },
        { new: true }
      );

    console.log(
      "UPDATED STARTUP:",
      updatedStartup
    );

    res.json(request);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const request = await Request.findById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    request.status = "rejected";

    await request.save();

    await Notification.create({
      user: request.sender,
      title: "Request Rejected",
      message: "Your co-founder request was rejected.",
    });

    res.json(request);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      sender: req.user.id,
    })
      .populate("receiver", "name email")
      .populate("startup", "title");

    res.json(requests);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  sendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
};