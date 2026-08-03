import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import {
  FaArrowRight,
  FaEnvelope,
  FaLock,
} from "react-icons/fa6";
import { FaGoogle } from "react-icons/fa";
import { firebaseLogin } from "../api/authApi";
import { auth } from "../firebase";

const getFriendlyAuthError = (error) => {
  const code = error?.code;

  if (code === "auth/invalid-credential") {
    return "Invalid email or password.";
  }

  if (code === "auth/user-not-found") {
    return "No account found with this email.";
  }

  if (code === "auth/wrong-password") {
    return "Invalid password.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google login was closed before it finished.";
  }

  if (
    code === "auth/account-exists-with-different-credential"
  ) {
    return "An account already exists with this email using another sign-in method.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Login failed"
  );
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    location.state?.from || "/";
  const safeRedirectTo = [
    "/login",
    "/register",
    "/complete-profile",
  ].includes(redirectTo)
    ? "/"
    : redirectTo;

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [verificationUser, setVerificationUser] =
    useState(null);
  const [notice, setNotice] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const createSession = async (firebaseUser) => {
    await reload(firebaseUser);

    const idToken =
      await firebaseUser.getIdToken(true);
    const res = await firebaseLogin({
      idToken,
      name: firebaseUser.displayName,
    });

    localStorage.setItem("token", res.data.token);
    window.dispatchEvent(new Event("storage"));

    if (!res.data.user?.profileCompleted) {
      navigate("/complete-profile", {
        replace: true,
      });
      return;
    }

    navigate(safeRedirectTo, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice("");
    setVerificationUser(null);

    try {
      setLoading(true);
      const credential =
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

      await reload(credential.user);

      if (!credential.user.emailVerified) {
        setVerificationUser(credential.user);
        setNotice(
          "Please verify your email before logging in. Check your inbox for the verification link."
        );
        return;
      }

      await createSession(credential.user);
    } catch (error) {
      alert(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setNotice("");
    setVerificationUser(null);

    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(
        auth,
        provider
      );

      await createSession(result.user);
    } catch (error) {
      alert(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const user = verificationUser || auth.currentUser;

      if (!user) {
        setNotice(
          "Please enter your email and password again before resending verification."
        );
        return;
      }

      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });

      setNotice(
        "Verification email sent again. After verifying, come back and log in."
      );
    } catch (error) {
      alert(getFriendlyAuthError(error));
    }
  };

  return (
    <div className="page-shell flex min-h-[calc(100vh-120px)] items-center justify-center">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_440px]">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">Welcome back</p>
          <h1 className="page-title">
            Your next founder conversation is waiting.
          </h1>
          <p className="page-subtitle">
            Sign in to manage your startup profile, reply to
            collaboration requests, and keep momentum with your
            network.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-panel p-6 sm:p-8"
        >
          <h2 className="text-3xl font-black">
            Login
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Access your FounderVerse workspace.
          </p>

          {notice && (
            <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
              <p>{notice}</p>
              {verificationUser && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="mt-3 font-black text-cyan-100 underline"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}

          <label className="mt-8 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
              <FaEnvelope />
              Email
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="field"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
              <FaLock />
              Password
            </span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="field"
              placeholder="Enter your password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-6 w-full"
          >
            {loading ? "Signing in..." : "Login"}
            <FaArrowRight />
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-secondary mt-3 w-full"
          >
            <FaGoogle />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            New here?{" "}
            <Link
              to="/register"
              className="font-bold text-cyan-200"
            >
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
