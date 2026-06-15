const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
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
    methods: ["GET", "POST"],
  },
});

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

io.on("connection", (socket) => {

  console.log(
    "User Connected:",
    socket.id
  );

  socket.on(
    "send_message",
    (data) => {

      socket.broadcast.emit(
        "receive_message",
        data
      );

    }
  );

  socket.on(
    "disconnect",
    () => {

      console.log(
        "User Disconnected:",
        socket.id
      );

    }
  );

});

app.get("/", (req, res) => {
  res.json({
    message: "FounderVerse API Running 🚀"
  });
});

app.get("/test-user", async (req, res) => {
  try {
    const user = await User.create({
      name: "Takee",
      email: "takee@test.com",
      password: "123456",
    });

    res.json(user);
  } catch (error) {
    res.json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});