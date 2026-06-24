const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const startupRoutes = require("./routes/startupRoutes");
const requestRoutes = require("./routes/requestRoutes");
const dashboardRoutes =
  require("./routes/dashboardRoutes");
const notificationRoutes =
  require("./routes/notificationRoutes");
const chatRoutes =
  require("./routes/chatRoutes");

dotenv.config();

connectDB();

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/startups", startupRoutes);
app.use("/api/requests", requestRoutes);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
app.use(
  "/api/notifications",
  notificationRoutes
);
app.use(
  "/api/chat",
  chatRoutes
);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(
        new Error("Authentication required")
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.id
    ).select("_id");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = {
      id: user._id.toString(),
    };

    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.user.id}`);

  console.log(
    "User Connected:",
    socket.user.id
  );

  socket.on(
    "disconnect",
    () => {

      console.log(
        "User Disconnected:",
        socket.user.id
      );

    }
  );

});

app.get("/", (req, res) => {
  res.json({
    message: "FounderVerse API Running 🚀"
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
