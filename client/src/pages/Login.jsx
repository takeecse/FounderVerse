import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
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

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    location.state?.from || "/dashboard";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const createSession = async (firebaseUser) => {
    const idToken = await firebaseUser.getIdToken();
    const res = await firebaseLogin({
      idToken,
      name: firebaseUser.displayName,
    });

    localStorage.setItem("token", res.data.token);
    window.dispatchEvent(new Event("storage"));
    navigate(redirectTo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const credential =
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

      if (!credential.user.emailVerified) {
        alert(
          "Please verify your email before logging in."
        );
        return;
      }

      await createSession(credential.user);
    } catch (error) {
      alert(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(
        auth,
        provider
      );

      await createSession(result.user);
    } catch (error) {
      alert(error.message || "Google login failed");
    } finally {
      setLoading(false);
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
