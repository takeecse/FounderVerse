import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  reload,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  FaArrowRight,
  FaEnvelope,
  FaLock,
  FaUser,
} from "react-icons/fa6";
import { FaGoogle } from "react-icons/fa";
import { firebaseLogin } from "../api/authApi";
import { auth } from "../firebase";

const getFriendlyRegisterError = (error) => {
  const code = error?.code;

  if (code === "auth/email-already-in-use") {
    return "This email already has an account. Try logging in; you can resend the verification email from the login page.";
  }

  if (code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }

  if (code === "auth/weak-password") {
    return "Password should be at least 6 characters.";
  }

  if (code === "auth/popup-closed-by-user") {
    return "Google signup was closed before it finished.";
  }

  if (
    code === "auth/account-exists-with-different-credential"
  ) {
    return "An account already exists with this email using another sign-in method.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Registration failed"
  );
};

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

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

    navigate("/", { replace: true });
  };

  const handleGoogleSignup = async () => {
    setSuccessEmail("");

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
      alert(getFriendlyRegisterError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessEmail("");

    try {
      setLoading(true);
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

      await updateProfile(credential.user, {
        displayName: formData.name,
      });

      await sendEmailVerification(
        credential.user,
        {
          url: `${window.location.origin}/login`,
          handleCodeInApp: false,
        }
      );

      setSuccessEmail(formData.email);
      setFormData({
        name: "",
        email: "",
        password: "",
      });

    } catch (error) {
      alert(getFriendlyRegisterError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex min-h-[calc(100vh-120px)] items-center justify-center">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_440px]">
        <div className="flex flex-col justify-center">
          <p className="eyebrow">Join the network</p>
          <h1 className="page-title">
            Build a founder identity people can trust.
          </h1>
          <p className="page-subtitle">
            Create your account, complete your profile, and
            start matching with teams, builders, and startup
            opportunities.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-panel p-6 sm:p-8"
        >
          <h2 className="text-3xl font-black">
            Create Account
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            FounderVerse starts with a verified account.
          </p>

          {successEmail && (
            <div className="mt-5 rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-100">
              <p className="font-bold">
                Verification email sent to {successEmail}.
              </p>
              <p className="mt-1">
                Open the verification link from your inbox,
                then come back and log in to complete your
                profile.
              </p>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-3 font-black text-cyan-100 underline"
              >
                Go to login
              </button>
            </div>
          )}

          <label className="mt-8 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
              <FaUser />
              Full name
            </span>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="field"
              placeholder="Your name"
              required
            />
          </label>

          <label className="mt-4 block">
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
              placeholder="At least 6 characters"
              minLength="6"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-6 w-full"
          >
            {loading ? "Creating..." : "Create Account"}
            <FaArrowRight />
          </button>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="btn btn-secondary mt-3 w-full"
          >
            <FaGoogle />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-cyan-200"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
