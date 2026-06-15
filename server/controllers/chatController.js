const Chat = require("../models/Chat");
const User = require("../models/User");

const sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      message,
    } = req.body;

    const chat = await Chat.create({
      sender: req.user.id,
      receiver: receiverId,
      message,
    });

    res.status(201).json(chat);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getConversation = async (req, res) => {
  try {

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
      .sort({ createdAt: 1 });

    res.json(messages);

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
    });

    const userIds = new Set();

    chats.forEach((chat) => {

      if (
        chat.sender.toString() !==
        req.user.id
      ) {
        userIds.add(
          chat.sender.toString()
        );
      }

      if (
        chat.receiver.toString() !==
        req.user.id
      ) {
        userIds.add(
          chat.receiver.toString()
        );
      }

    });

    const users = await User.find({
      _id: {
        $in: [...userIds],
      },
    }).select("name email");

    res.json(users);

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