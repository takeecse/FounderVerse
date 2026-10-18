const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const firebaseAdmin = require("../config/firebaseAdmin");
const {
  getPrimaryRole,
  getUserRoles,
  getVerificationMap,
  isConfiguredAdminEmail,
  isConfiguredSystemEmail,
} = require("../utils/roles");

const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY ||
  "AIzaSyDsWjs9r81XxwVl9oLqAqeWkpeSnv51eLc";

const createToken = (userId, authMethod = "firebase") =>
  jwt.sign(
    {
      id: userId,
      authMethod,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

const getConfiguredSystemRole = (email) => {
  if (isConfiguredSystemEmail(email)) return "system";
  if (isConfiguredAdminEmail(email)) return "admin";
  return "user";
};

const syncConfiguredAccess = async (user) => {
  const configuredRole = getConfiguredSystemRole(user.email);

  if (configuredRole === "system") {
    if (user.systemRole !== "system") {
      user.systemRole = "system";
      await user.save();
    }

    return user;
  }

  if (user.systemRole === "system") {
    user.systemRole = configuredRole;
    await user.save();
  } else if (configuredRole === "admin" && user.systemRole === "user") {
    user.systemRole = configuredRole;
    await user.save();
  }

  return user;
};

const serializeAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  photoURL: user.photoURL,
  roles: getUserRoles(user),
  role: getPrimaryRole(user),
  verification: getVerificationMap(user.verification),
  isAdmin: user.systemRole === "admin",
  isSystem: user.systemRole === "system",
  accountStatus: user.accountStatus || "active",
  profileCompleted: user.profileCompleted,
});

const getVerifiedFirebaseUser = async (
  idToken,
  displayName
) => {
  if (!idToken) {
    const error = new Error("Firebase ID token is required");
    error.statusCode = 400;
    throw error;
  }

  const decoded = await verifyFirebaseIdToken(idToken);

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
  }).select("+systemRole");

  if (!user) {
    const configuredRole = getConfiguredSystemRole(decoded.email);
    user = await User.create({
      firebaseUid: decoded.uid,
      name: fallbackName,
      email: decoded.email,
      photoURL: decoded.picture || "",
      systemRole: configuredRole,
    });

    return user;
  }

  if (
    user.firebaseUid !== decoded.uid &&
    user.password &&
    (isConfiguredAdminEmail(decoded.email) ||
      isConfiguredSystemEmail(decoded.email))
  ) {
    const error = new Error(
      "This operator email is linked to a password-based account. Contact a system operator to safely migrate it."
    );
    error.statusCode = 409;
    throw error;
  }

  user.firebaseUid = decoded.uid;
  user.name = user.name || fallbackName;
  user.photoURL =
    user.photoURL || decoded.picture || "";

  if (user.accountStatus === "suspended") {
    const error = new Error("This account has been suspended. Contact support for help.");
    error.statusCode = 403;
    throw error;
  }

  await syncConfiguredAccess(user);

  return user.save();
};

const verifyFirebaseIdToken = async (idToken) => {
  try {
    const decoded = await firebaseAdmin
      .auth()
      .verifyIdToken(idToken);

    return decoded;
  } catch (adminError) {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.users?.length) {
      const error = new Error(
        data.error?.message ||
          adminError.message ||
          "Firebase token verification failed"
      );
      error.statusCode = 401;
      throw error;
    }

    const user = data.users[0];

    return {
      uid: user.localId,
      email: user.email,
      email_verified: user.emailVerified,
      name: user.displayName,
      picture: user.photoUrl,
    };
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      isConfiguredAdminEmail(email) ||
      isConfiguredSystemEmail(email)
    ) {
      return res.status(403).json({
        message: "Operator accounts must be created and verified through Firebase sign-in",
      });
    }

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
      systemRole: "user",
    });

    res.status(201).json({
      message: "User registered successfully",
      token: createToken(user._id, "password"),
      user: serializeAuthUser(user),
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

    const user = await User.findOne({ email }).select(
      "+systemRole"
    );

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    if (
      user.systemRole !== "user" ||
      isConfiguredAdminEmail(user.email) ||
      isConfiguredSystemEmail(user.email)
    ) {
      return res.status(403).json({
        message: "Operator accounts must sign in through verified Firebase authentication",
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

    if (user.accountStatus === "suspended") {
      return res.status(403).json({
        message: "This account has been suspended. Contact support for help.",
      });
    }

    const token = createToken(user._id, "password");

    res.json({
      message: "Login successful",
      token,
      user: serializeAuthUser(user),
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
    const token = createToken(user._id, "firebase");

    res.json({
      message: "Firebase Login Successful",
      token,
      user: serializeAuthUser(user),
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
