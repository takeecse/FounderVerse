const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const firebaseAdmin = require("../config/firebaseAdmin");
const { getAuth } = require("firebase-admin/auth");

const createToken = (userId) =>
  jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

const getVerifiedFirebaseUser = async (
  idToken,
  displayName
) => {
  if (!idToken) {
    const error = new Error("Firebase ID token is required");
    error.statusCode = 400;
    throw error;
  }

  const decoded =
    await getAuth().verifyIdToken(idToken);

  if (!decoded.email) {
    const error = new Error(
      "Firebase account must include an email"
    );
    error.statusCode = 400;
    throw error;
  }

  if (decoded.email_verified === false) {
    const error = new Error(
      "Please verify your email before logging in"
    );
    error.statusCode = 403;
    throw error;
  }

  const fallbackName =
    displayName ||
    decoded.name ||
    decoded.email.split("@")[0];

  let user = await User.findOne({
    $or: [
      { firebaseUid: decoded.uid },
      { email: decoded.email },
    ],
  });

  if (!user) {
    user = await User.create({
      firebaseUid: decoded.uid,
      name: fallbackName,
      email: decoded.email,
      photoURL: decoded.picture || "",
    });

    return user;
  }

  user.firebaseUid = decoded.uid;
  user.name = user.name || fallbackName;
  user.photoURL =
    decoded.picture || user.photoURL || "";

  return user.save();
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    const token = createToken(user._id);

    res.json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { idToken, name } = req.body;
    const user = await getVerifiedFirebaseUser(
      idToken,
      name
    );
    const token = createToken(user._id);

    res.json({
      message: "Firebase Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
      },
    });

  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message,
    });
  }
};

const firebaseLogin = googleLogin;

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  firebaseLogin,
};
