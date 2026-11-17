const Request = require("../models/Request");
const Startup = require("../models/Startup");
const User = require("../models/User");
const mongoose = require("mongoose");
const {
  createNotification,
} = require("./notificationController");
const { canManageStartup } = require("../utils/startupAccess");

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.]{2,23}$/;

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const requestScope = (senderId, receiverId, startupId) => ({
  sender: senderId,
  receiver: receiverId,
  startup: startupId || null,
});

const activeRequestStatuses = ["pending", "accepted"];

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

    if (receiver.accountStatus === "suspended") {
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

      if (startup.moderationStatus === "banned") {
        return res.status(403).json({
          message: "Requests are unavailable while this startup is temporarily banned",
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

      const alreadyMember = startup.teamMembers.some(
        (member) => member.toString() === req.user.id
      );

      if (alreadyMember) {
        return res.status(400).json({
          message: "You are already a member of this startup",
        });
      }
    }

    const duplicateRequestQuery = startup
      ? requestScope(req.user.id, receiverId, startup._id)
      : {
          $or: [
            requestScope(req.user.id, receiverId, null),
            requestScope(receiverId, req.user.id, null),
          ],
        };

    const existingRequest =
      await Request.findOne({
        ...duplicateRequestQuery,
        status: {
          $in: activeRequestStatuses,
        },
      });

    if (existingRequest) {
      return res.status(400).json({
        message:
          existingRequest.status === "accepted"
            ? "You are already connected"
            : "Request already sent",
      });
    }

    if (!startup) {
      const alreadyConnected =
        receiver.connections.some(
          (connection) =>
            connection.toString() === req.user.id
        );

      if (alreadyConnected) {
        return res.status(400).json({
          message: "You are already connected",
        });
      }
    }

    const request = await Request.create({
      sender: req.user.id,
      receiver: receiverId,
      startup: startup?._id || null,
      message,
    });

    await createNotification(req, {
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

const inviteStartupMember = async (req, res) => {
  try {
    const startupId = req.params.id;
    const username = typeof req.body.username === "string"
      ? req.body.username.trim().replace(/^@/, "").toLowerCase()
      : "";
    const role = typeof req.body.role === "string"
      ? req.body.role.trim().slice(0, 60)
      : "";
    const message = typeof req.body.message === "string"
      ? req.body.message.trim().slice(0, 1200)
      : "";

    if (!isValidId(startupId)) {
      return res.status(400).json({ message: "Invalid startup" });
    }
    if (!USERNAME_PATTERN.test(username)) {
      return res.status(400).json({ message: "Enter a valid username (3–24 letters, numbers, dots, or underscores)." });
    }
    if (!role) {
      return res.status(400).json({ message: "Choose a role for this startup member." });
    }

    const startup = await Startup.findById(startupId);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.moderationStatus === "banned") {
      return res.status(403).json({ message: "A banned startup cannot invite members." });
    }
    if (!canManageStartup(startup, req.user.id)) {
      return res.status(403).json({ message: "Only this startup's founder or startup admin can invite members." });
    }

    const invitee = await User.findOne({
      username,
      accountStatus: { $ne: "suspended" },
    }).select("_id name username");
    if (!invitee) return res.status(404).json({ message: "No active member has that username." });
    if (invitee._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot invite yourself." });
    }
    if (startup.teamMembers.some((member) => member.toString() === invitee._id.toString())) {
      return res.status(409).json({ message: "That person is already on this startup team." });
    }

    const existingInvite = await Request.findOne({
      startup: startup._id,
      receiver: invitee._id,
      requestType: "startup_invite",
      status: "pending",
    });
    if (existingInvite) {
      return res.status(409).json({ message: "There is already an active invitation for that member." });
    }

    const request = await Request.create({
      sender: req.user.id,
      receiver: invitee._id,
      startup: startup._id,
      requestType: "startup_invite",
      startupRole: role,
      message: message || `You are invited to join ${startup.title} as ${role}.`,
    });

    await createNotification(req, {
      user: invitee._id,
      title: `Invitation to join ${startup.title}`,
      message: `You have been invited to join ${startup.title} as ${role}. Review the request to accept or decline.`,
    });

    res.status(201).json({ request, invitee: { _id: invitee._id, name: invitee.name, username: invitee.username } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRequestStatus = async (req, res) => {
  try {
    const { receiverId, startupId } = req.query;

    if (!isValidId(receiverId)) {
      return res.status(400).json({
        message: "Invalid receiver",
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

      if (startup.founder.toString() === req.user.id) {
        return res.json({
          status: "founder",
        });
      }

      if (
        startup.teamMembers.some(
          (member) => member.toString() === req.user.id
        )
      ) {
        return res.json({
          status: "member",
        });
      }
    }

    const requestQuery = startup
      ? requestScope(req.user.id, receiverId, startup._id)
      : {
          $or: [
            requestScope(req.user.id, receiverId, null),
            requestScope(receiverId, req.user.id, null),
          ],
        };

    const [currentUser, request] = await Promise.all([
      User.findById(req.user.id).select("connections"),
      Request.findOne({
        ...requestQuery,
        status: {
          $in: activeRequestStatuses,
        },
      })
        .sort({ createdAt: -1 })
        .select("status"),
    ]);

    if (
      !startup &&
      currentUser?.connections.some(
        (connection) => connection.toString() === receiverId
      )
    ) {
      return res.json({
        status: "connected",
      });
    }

    res.json({
      status: request?.status || "none",
    });

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
          "name username email photoURL role roles"
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
          "name username email photoURL role roles"
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

    if (request.requestType === "startup_invite") {
      const startup = await Startup.findById(request.startup);
      if (!startup) {
        return res.status(404).json({ message: "This startup no longer exists." });
      }
      if (startup.moderationStatus === "banned") {
        return res.status(403).json({ message: "This startup is temporarily banned and cannot add members." });
      }
      if (startup.teamMembers.some((member) => member.toString() === req.user.id)) {
        return res.status(409).json({ message: "You are already a member of this startup." });
      }

      startup.teamMembers.addToSet(req.user.id);
      const membership = startup.teamMemberRoles.find((item) => item.user.toString() === req.user.id);
      if (membership) {
        membership.role = request.startupRole || "Member";
        membership.isAdmin = false;
        membership.addedBy = request.sender;
        membership.addedAt = new Date();
      } else {
        startup.teamMemberRoles.push({
          user: req.user.id,
          role: request.startupRole || "Member",
          isAdmin: false,
          addedBy: request.sender,
        });
      }

      request.status = "accepted";
      await Promise.all([startup.save(), request.save()]);
      await createNotification(req, {
        user: request.sender,
        title: "Startup invitation accepted",
        message: `Your invitation to join ${startup.title} was accepted as ${request.startupRole || "Member"}.`,
      });

      return res.json(request);
    }

    request.status =
      "accepted";

    if (request.startup) {
      const startup = await Startup.findOne({
        _id: request.startup,
        founder: req.user.id,
      });
      if (!startup) return res.status(404).json({ message: "Startup not found" });
      if (!startup.teamMembers.some((member) => member.toString() === request.sender.toString())) {
        startup.teamMembers.addToSet(request.sender);
      }
      if (!startup.teamMemberRoles.some((item) => item.user.toString() === request.sender.toString())) {
        startup.teamMemberRoles.push({ user: request.sender, role: "Member", addedBy: req.user.id });
      }
      await startup.save();
    }

    await request.save();

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

    await createNotification(req, {
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

    await createNotification(req, {
      user: request.sender,
      title: request.requestType === "startup_invite" ? "Startup invitation declined" : "Request Rejected",
      message: request.requestType === "startup_invite"
        ? "Your startup invitation was declined."
        : "Your co-founder request was rejected.",
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
  inviteStartupMember,
  getRequestStatus,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
};
