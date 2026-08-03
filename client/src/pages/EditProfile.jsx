import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  FaArrowLeft,
  FaCamera,
  FaFloppyDisk,
  FaTrash,
} from "react-icons/fa6";
import {
  getProfile,
  updateProfile,
} from "../api/userApi";
import { auth } from "../firebase";

const listToText = (value) =>
  Array.isArray(value) ? value.join(", ") : "";

const textToList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const MAX_AVATAR_SIZE = 1024 * 1024;

function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState("");
  const [profileCompleted, setProfileCompleted] =
    useState(null);
  const [googlePhotoURL, setGooglePhotoURL] = useState(
    auth.currentUser?.photoURL || ""
  );
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    location: "",
    bio: "",
    skills: "",
    interests: "",
    lookingFor: "",
    github: "",
    linkedin: "",
    portfolio: "",
    photoURL: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setGooglePhotoURL(user?.photoURL || "");
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        const user = res.data;

        setProfileCompleted(Boolean(user.profileCompleted));
        setFormData({
          name: user.name || "",
          role: user.role || "",
          location: user.location || "",
          bio: user.bio || "",
          skills: listToText(user.skills),
          interests: listToText(user.interests),
          lookingFor: listToText(user.lookingFor),
          github: user.github || "",
          linkedin: user.linkedin || "",
          portfolio: user.portfolio || "",
          photoURL: user.photoURL || "",
        });
      } catch (error) {
        console.error(error);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setImageError(
        "Please choose an image smaller than 1MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setFormData((current) => ({
        ...current,
        photoURL: reader.result,
      }));
      setImageError("");
    };

    reader.onerror = () => {
      setImageError("Could not read this image.");
    };

    reader.readAsDataURL(file);
  };

  const removeProfileImage = () => {
    setFormData((current) => ({
      ...current,
      photoURL: "",
    }));
    setImageError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      const res = await updateProfile({
        name: formData.name,
        role: formData.role,
        location: formData.location,
        bio: formData.bio,
        skills: textToList(formData.skills),
        interests: textToList(formData.interests),
        lookingFor: textToList(formData.lookingFor),
        github: formData.github,
        linkedin: formData.linkedin,
        portfolio: formData.portfolio,
        photoURL: formData.photoURL,
      });

      window.dispatchEvent(
        new CustomEvent("founderverse:profile-updated", {
          detail: res.data,
        })
      );

      navigate(profileCompleted ? "/profile" : "/", {
        replace: !profileCompleted,
      });
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  const previewPhotoURL =
    formData.photoURL ||
    googlePhotoURL ||
    `https://ui-avatars.com/api/?name=${formData.name || "Founder"}`;
  const hasCustomPhoto = Boolean(
    formData.photoURL &&
      (!googlePhotoURL || formData.photoURL !== googlePhotoURL)
  );
  const isCompletionRoute =
    location.pathname === "/complete-profile";
  const isOnboarding =
    isCompletionRoute || profileCompleted === false;

  if (
    profileCompleted &&
    isCompletionRoute &&
    !saving
  ) {
    return <Navigate to="/profile" replace />;
  }

  if (profileCompleted === null) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading profile...
      </div>
    );
  }

  return (
    <div
      className={
        isOnboarding
          ? "onboarding-shell"
          : "page-shell"
      }
    >
      <div className="section-head">
        <div>
          <p className="eyebrow">Founder identity</p>
          <h1 className="page-title">
            {isOnboarding
              ? "Complete Profile"
              : "Edit Profile"}
          </h1>
          <p className="page-subtitle">
            Keep your skills, links, and collaboration intent
            sharp so the right people understand where you fit.
          </p>
        </div>
        {!isOnboarding && (
          <Link to="/profile" className="btn btn-secondary">
            <FaArrowLeft />
            Back
          </Link>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`glass-panel p-6 sm:p-8 ${
          isOnboarding ? "onboarding-card" : ""
        }`}
      >
        <section className="mb-8 flex flex-col gap-6 rounded-lg border border-white/10 bg-white/5 p-5 md:flex-row md:items-center">
          <img
            src={previewPhotoURL}
            alt="Profile preview"
            className="avatar h-28 w-28"
          />

          <div className="flex-1">
            <h2 className="text-2xl font-black">
              Profile picture
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Upload a clear founder photo or logo-style headshot.
              This image appears on your profile, founder cards,
              requests, and chat conversations.
            </p>

            {imageError && (
              <p className="mt-3 text-sm font-bold text-rose-200">
                {imageError}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <label className="btn btn-secondary">
                <FaCamera />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {hasCustomPhoto && (
                <button
                  type="button"
                  onClick={removeProfileImage}
                  className="btn btn-danger"
                >
                  <FaTrash />
                  {googlePhotoURL ? "Use Google Photo" : "Remove"}
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="mb-5">
          <h2 className="text-2xl font-black">
            Founder basics
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            These fields make your profile useful for matching,
            requests, and collaboration decisions.
          </p>
        </div>

        <div className="form-grid">
          <input
            type="text"
            name="name"
            placeholder="Founder name"
            value={formData.name}
            onChange={handleChange}
            className="field"
            required
          />
          <input
            type="text"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleChange}
            className="field"
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="field"
            required
          />
          <input
            type="text"
            name="skills"
            placeholder="Skills: React, Growth, UX"
            value={formData.skills}
            onChange={handleChange}
            className="field"
            required
          />
          <input
            type="text"
            name="interests"
            placeholder="Interests: AI, SaaS, FinTech"
            value={formData.interests}
            onChange={handleChange}
            className="field"
            required
          />
          <input
            type="text"
            name="lookingFor"
            placeholder="Looking for: Designer, Marketer"
            value={formData.lookingFor}
            onChange={handleChange}
            className="field"
            required
          />
          <input
            type="text"
            name="github"
            placeholder="GitHub URL"
            value={formData.github}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="linkedin"
            placeholder="LinkedIn URL"
            value={formData.linkedin}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="portfolio"
            placeholder="Portfolio URL"
            value={formData.portfolio}
            onChange={handleChange}
            className="field md:col-span-2"
          />
        </div>

        <textarea
          name="bio"
          placeholder="Tell founders about your background, strengths, and goals."
          value={formData.bio}
          onChange={handleChange}
          className="textarea mt-4"
          required
        />

        <div className="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-5">
          <h3 className="text-xl font-black">
            Make it productive
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Add concrete skills, what you are building toward, and
            who you want to meet. Strong profiles get better
            collaboration requests and cleaner chat conversations.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary mt-6"
        >
          <FaFloppyDisk />
          {saving
            ? "Saving..."
            : isOnboarding
              ? "Complete Profile"
              : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

export default EditProfile;
