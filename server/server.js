const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const startupRoutes = require("./routes/startupRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/startups", startupRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});