import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import {
  FaArrowRight,
  FaEnvelope,
  FaLock,
  FaUser,
} from "react-icons/fa6";
import { auth } from "../firebase";

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        credential.user
      );

      alert(
        "Account created. Please verify your email before logging in."
      );

      navigate("/login");
    } catch (error) {
      alert(error.message || "Registration failed");
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
