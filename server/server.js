const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const jwt = require("jsonwebtoken");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const startupRoutes = require("./routes/startupRoutes");
const requestRoutes = require("./routes/requestRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const chatRoutes = require("./routes/chatRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const systemRoutes = require("./routes/systemRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();
const server = http.createServer(app);

const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
  ...parseOrigins(process.env.CLIENT_URLS),
].filter(Boolean));

const isPrivateNetworkHost = (hostname) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "0.0.0.0" ||
  /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
  /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(
    hostname
  );

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const { hostname, protocol } = new URL(origin);

    if (!["http:", "https:"].includes(protocol)) {
      return false;
    }

    return (
      isPrivateNetworkHost(hostname) ||
      hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/startups", startupRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/reports", reportRoutes);

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
    ).select("_id accountStatus");

    if (!user || user.accountStatus === "suspended") {
      return next(new Error("User account is unavailable"));
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

  console.log("User Connected:", socket.user.id);

  socket.on("disconnect", () => {
    console.log(
      "User Disconnected:",
      socket.user.id
    );
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "FounderVerse API Running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
