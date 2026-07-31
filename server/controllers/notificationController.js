const Notification = require("../models/Notification");

const serializeNotification = (notification) => ({
  _id: notification._id.toString(),
  user: notification.user.toString(),
  title: notification.title,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const emitNotification = (req, notification) => {
  const io = req.app.get("io");

  if (!io) {
    return;
  }

  io.to(`user:${notification.user.toString()}`).emit(
    "notification:new",
    serializeNotification(notification)
  );
};

const createNotification = async (req, payload) => {
  const notification = await Notification.create(payload);

  emitNotification(req, notification);

  return notification;
};

const getNotifications = async (req, res) => {
  try {
    const notifications =
      await Notification.find({
        user: req.user.id,
      }).sort({
        createdAt: -1,
      });

    res.json(notifications);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {

    const result = await Notification.updateMany(
      {
        user: req.user.id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    if (result.modifiedCount > 0) {
      const io = req.app.get("io");

      if (io) {
        io.to(`user:${req.user.id}`).emit(
          "notifications:read-all"
        );
      }
    }

    res.json({
      message: "Notifications marked as read",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAllAsRead,
};
