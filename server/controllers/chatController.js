const Chat = require("../models/Chat");
const User = require("../models/User");
const mongoose = require("mongoose");

const isValidId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const serializeMessage = (chat) => ({
  _id: chat._id.toString(),
  sender: chat.sender.toString(),
  receiver: chat.receiver.toString(),
  message: chat.message,
  isRead: chat.isRead,
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
});

const getPageLimit = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 50;
  }

  return Math.min(parsed, 100);
};

const markConversationMessagesRead = async (
  req,
  conversationUserId
) => {
  const readResult = await Chat.updateMany(
    {
      sender: conversationUserId,
      receiver: req.user.id,
      isRead: { $ne: true },
    },
    {
      isRead: true,
    }
  );

  if (readResult.modifiedCount > 0) {
    const io = req.app.get("io");

    if (io) {
      io.to(`user:${req.user.id}`).emit("messages_read", {
        conversationUserId,
      });
    }
  }

  return readResult;
};

const sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      message,
    } = req.body;

    const cleanMessage = message?.trim();

    if (!isValidId(receiverId)) {
      return res.status(400).json({
        message: "Invalid receiver",
      });
    }

    if (receiverId === req.user.id) {
      return res.status(400).json({
        message: "You cannot message yourself",
      });
    }

    if (!cleanMessage) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    const chat = await Chat.create({
      sender: req.user.id,
      receiver: receiverId,
      message: cleanMessage,
      isRead: false,
    });

    const payload = serializeMessage(chat);
    const io = req.app.get("io");

    if (io) {
      io.to(`user:${req.user.id}`)
        .to(`user:${receiverId}`)
        .emit("receive_message", payload);
    }

    res.status(201).json(payload);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getConversation = async (req, res) => {
  try {
    if (!isValidId(req.params.userId)) {
      return res.status(400).json({
        message: "Invalid user",
      });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        message: "You cannot open a conversation with yourself",
      });
    }

    await markConversationMessagesRead(
      req,
      req.params.userId
    );

    const baseQuery = {
      $or: [
        {
          sender: req.user.id,
          receiver: req.params.userId,
        },
        {
          sender: req.params.userId,
          receiver: req.user.id,
        },
      ],
    };

    const limit = getPageLimit(req.query.limit);
    const beforeDate = req.query.before
      ? new Date(req.query.before)
      : null;

    const pagedQuery =
      beforeDate && !Number.isNaN(beforeDate.getTime())
        ? {
            ...baseQuery,
            createdAt: {
              $lt: beforeDate,
            },
          }
        : baseQuery;

    const messages = await Chat.find(pagedQuery)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    const pageMessages = messages
      .slice(0, limit)
      .reverse()
      .map((message) => ({
        ...message,
        _id: message._id.toString(),
        sender: message.sender.toString(),
        receiver: message.receiver.toString(),
        isRead: message.isRead,
      }));

    res.json({
      messages: pageMessages,
      hasMore,
      nextCursor: pageMessages[0]?.createdAt || null,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const markConversationRead = async (req, res) => {
  try {
    if (!isValidId(req.params.userId)) {
      return res.status(400).json({
        message: "Invalid user",
      });
    }

    if (req.params.userId === req.user.id) {
      return res.status(400).json({
        message: "You cannot open a conversation with yourself",
      });
    }

    const readResult = await markConversationMessagesRead(
      req,
      req.params.userId
    );

    res.json({
      modifiedCount: readResult.modifiedCount,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(
      req.user.id
    );

    const summaries = await Chat.aggregate([
      {
        $match: {
          $or: [
            { sender: userObjectId },
            { receiver: userObjectId },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userObjectId] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$message" },
          lastMessageAt: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userObjectId] },
                    { $ne: ["$isRead", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    const users = await User.find({
      _id: {
        $in: summaries.map((summary) => summary._id),
      },
    })
      .select("name email photoURL role location")
      .lean();

    const userById = new Map(
      users.map((user) => [
        user._id.toString(),
        user,
      ])
    );

    const conversations = summaries.flatMap((summary) => {
      const user = userById.get(summary._id.toString());

      if (!user) {
        return [];
      }

      return {
        ...user,
        _id: user._id.toString(),
        lastMessage: summary.lastMessage || "",
        lastMessageAt: summary.lastMessageAt || null,
        unreadCount: summary.unreadCount || 0,
      };
    });

    res.json(conversations);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markConversationRead,
};
