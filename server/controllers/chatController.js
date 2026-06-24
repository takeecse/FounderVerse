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
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
});

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

    const messages = await Chat.find({
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
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json(
      messages.map((message) => ({
        ...message,
        _id: message._id.toString(),
        sender: message.sender.toString(),
        receiver: message.receiver.toString(),
      }))
    );

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getConversations = async (req, res) => {
  try {

    const chats = await Chat.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    const latestByUser = new Map();

    chats.forEach((chat) => {
      const otherUserId =
        chat.sender.toString() === req.user.id
          ? chat.receiver.toString()
          : chat.sender.toString();

      if (!latestByUser.has(otherUserId)) {
        latestByUser.set(otherUserId, chat);
      }

    });

    const users = await User.find({
      _id: {
        $in: [...latestByUser.keys()],
      },
    })
      .select("name email photoURL role location")
      .lean();

    const conversations = users.map((user) => {
      const latestMessage = latestByUser.get(
        user._id.toString()
      );

      return {
        ...user,
        _id: user._id.toString(),
        lastMessage: latestMessage?.message || "",
        lastMessageAt: latestMessage?.createdAt || null,
      };
    });

    res.json(
      conversations.sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0) -
          new Date(a.lastMessageAt || 0)
      )
    );

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
};
