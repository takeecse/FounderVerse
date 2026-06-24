const Request = require("../models/Request");
const Startup = require("../models/Startup");
const Notification = require("../models/Notification");
const User = require("../models/User");
const mongoose = require("mongoose");

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const sendRequest = async (req, res) => {
  try {
    const {
      receiverId,
      startupId,
      message,
    } = req.body;

    if (!isValidId(receiverId)) {
      return res.status(400).json({
        message: "Invalid receiver",
      });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({
        message: "You cannot send a request to yourself",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    let startup = null;

    if (startupId) {
      if (!isValidId(startupId)) {
        return res.status(400).json({
          message: "Invalid startup",
        });
      }

      startup = await Startup.findById(startupId);

      if (!startup) {
        return res.status(404).json({
          message: "Startup not found",
        });
      }

      if (
        startup.founder.toString() !== receiverId
      ) {
        return res.status(400).json({
          message:
            "Request receiver must be the startup founder",
        });
      }
    }

    const existingRequest =
      await Request.findOne({
        sender: req.user.id,
        receiver: receiverId,
        startup: startup?._id || null,
        status: "pending",
      });

    if (existingRequest) {
      return res.status(400).json({
        message:
          "Request already sent",
      });
    }

    const request = await Request.create({
      sender: req.user.id,
      receiver: receiverId,
      startup: startup?._id || null,
      message,
    });

    await Notification.create({
      user: receiverId,
      title: "New Co-Founder Request",
      message: startup
        ? `You received a request to join ${startup.title}.`
        : "You received a new collaboration request.",
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

    const requests =
      await Request.find({
        receiver: req.user.id,
      })
        .sort({ createdAt: -1 })
        .populate(
          "sender",
          "name email photoURL role"
        )
        .populate(
          "startup",
          "title"
        );

    res.json(requests);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSentRequests = async (req, res) => {
  try {

    const requests =
      await Request.find({
        sender: req.user.id,
      })
        .sort({ createdAt: -1 })
        .populate(
          "receiver",
          "name email photoURL role"
        )
        .populate(
          "startup",
          "title"
        );

    res.json(requests);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const acceptRequest = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    const request =
      await Request.findById(
        req.params.id
      );

    if (!request) {
      return res.status(404).json({
        message:
          "Request not found",
      });
    }

    if (
      request.receiver.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized to accept this request",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Request has already been handled",
      });
    }

    request.status =
      "accepted";

    await request.save();

    if (request.startup) {
      await Startup.updateOne(
        {
          _id: request.startup,
          founder: req.user.id,
        },
        {
          $addToSet: {
            teamMembers: request.sender,
          },
        }
      );
    }

    await User.updateOne(
      { _id: req.user.id },
      {
        $addToSet: {
          connections: request.sender,
        },
      }
    );

    await User.updateOne(
      { _id: request.sender },
      {
        $addToSet: {
          connections: req.user.id,
        },
      }
    );

    await Notification.create({
      user: request.sender,
      title: "Request Accepted",
      message:
        "Your co-founder request was accepted.",
    });

    res.json(request);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const rejectRequest = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    const request =
      await Request.findById(
        req.params.id
      );

    if (!request) {
      return res.status(404).json({
        message:
          "Request not found",
      });
    }

    if (
      request.receiver.toString() !==
      req.user.id
    ) {
      return res.status(403).json({
        message: "Not authorized to reject this request",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "Request has already been handled",
      });
    }

    request.status =
      "rejected";

    await request.save();

    await Notification.create({
      user: request.sender,
      title: "Request Rejected",
      message:
        "Your co-founder request was rejected.",
    });

    res.json(request);

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
