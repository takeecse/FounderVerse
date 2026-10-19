import { useEffect, useRef, useState } from "react";
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
import {
  USER_ROLES,
  normalizeRoles,
} from "../utils/roles";

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [profileCompleted, setProfileCompleted] =
    useState(null);
  const fieldRefs = useRef({});
  const [googlePhotoURL, setGooglePhotoURL] = useState(
    auth.currentUser?.photoURL || ""
  );
  const [formData, setFormData] = useState({
    name: "",
    roles: [],
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
          roles: normalizeRoles(user),
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setFormError("");
  };

  const handleRoleToggle = (role) => {
    setFieldErrors((current) => {
      if (!current.roles) return current;
      const next = { ...current };
      delete next.roles;
      return next;
    });
    setFormError("");
    setFormData((current) => {
      const hasRole = current.roles.includes(role);

      return {
        ...current,
        roles: hasRole
          ? current.roles.filter((item) => item !== role)
          : [...current.roles, role],
      };
    });
  };

  const focusField = (fieldName) => {
    const field = fieldRefs.current[fieldName];

    if (!field) return;

    field.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    field.focus({ preventScroll: true });
  };

  const focusFirstError = (errors) => {
    const firstField = [
      "roles",
      "name",
      "location",
      "bio",
      "skills",
      "interests",
      "lookingFor",
      "github",
      "linkedin",
      "portfolio",
    ].find((field) => errors[field]);

    if (firstField) focusField(firstField);
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
    setFormError("");

    const validationErrors = {};

    if (!formData.name.trim()) {
      validationErrors.name = "Enter your name.";
    }

    if (formData.roles.length === 0) {
      validationErrors.roles = "Select one of the role cards below to continue.";
    }

    if (!formData.location.trim()) {
      validationErrors.location = "Enter your location.";
    }

    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      focusFirstError(validationErrors);
      return;
    }

    try {
      setSaving(true);
      const res = await updateProfile({
        name: formData.name,
        roles: formData.roles,
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

      if (!res.data?.profileCompleted) {
        setFormError(
          "Your profile details were saved, but setup is not marked complete yet. Please check the required information and try again."
        );
        return;
      }

      setProfileCompleted(true);

      window.dispatchEvent(
        new CustomEvent("founderverse:profile-updated", {
          detail: res.data,
        })
      );

      navigate("/", { replace: true });
    } catch (error) {
      const missingFields =
        error.response?.data?.missingFields || [];
      const serverErrors = missingFields.reduce(
        (errors, field) => {
          const labels = {
            name: "Enter your name.",
            roles: "Select one of the role cards below to continue.",
            location: "Enter your location.",
            bio: "Add a short introduction.",
            skills: "Add your skills.",
            interests: "Add your interests.",
            lookingFor: "Tell us who you are looking for.",
          };

          if (labels[field]) errors[field] = labels[field];
          return errors;
        },
        {}
      );

      if (
        error.response?.data?.message?.includes(
          "choose at least one public role"
        )
      ) {
        serverErrors.roles = "Select one of the role cards below to continue.";
      }

      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
        focusFirstError(serverErrors);
      } else {
        setFormError(
          error.response?.data?.message ||
            "Could not save your profile. Please try again."
        );
      }
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
  return <Navigate to="/" replace />;
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
        noValidate
        className={`glass-panel p-6 sm:p-8 ${isOnboarding ? "onboarding-card" : ""
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
              Profile picture (optional)
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Upload a clear profile photo or professional headshot.
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
            Profile basics
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Start with your name, role, and location. You can add
            more profile details later.
          </p>
          <p className="mt-2 text-sm text-cyan-100">
            Name, one role, and location are required.
          </p>
        </div>

        <fieldset
          aria-invalid={Boolean(fieldErrors.roles)}
          aria-describedby={fieldErrors.roles ? "roles-error" : undefined}
          className={`mb-5 min-w-0 rounded-lg border p-4 sm:p-5 ${fieldErrors.roles ? "border-rose-300/70 bg-rose-300/5" : "border-white/10 bg-white/5"}`}
        >
          <legend className="px-2 text-lg font-black">
            Choose your role <span className="text-sm font-bold text-cyan-100">(required)</span>
          </legend>
          <p className="text-sm text-slate-400">
            Select at least one role card. This choice does not verify the role; verification is reviewed by admins separately.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {USER_ROLES.map((role) => {
              const active = formData.roles.includes(role);

              return (
                <button
                  key={role}
                  ref={role === USER_ROLES[0] ? (element) => {
                    fieldRefs.current.roles = element;
                  } : undefined}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleRoleToggle(role)}
                  className={`rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${active
                    ? "border-cyan-300/60 bg-cyan-300/12 text-white"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className="font-black">{role}</span>
                  <span className="mt-1 block text-sm text-slate-400">
                    {role === "Founder"
                      ? "Build startups, manage ventures, and find collaborators."
                      : role === "Investor"
                        ? "Discover startups and investment opportunities."
                        : role === "Mentor"
                          ? "Offer guidance, feedback, and domain expertise."
                          : "Find teams, projects, and collaboration paths."}
                  </span>
                  {active && (
                    <span className="mt-3 block text-xs font-black uppercase tracking-wide text-cyan-100">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {fieldErrors.roles && (
            <p id="roles-error" className="mt-4 text-sm font-bold text-rose-200" role="alert">
              {fieldErrors.roles}
            </p>
          )}
        </fieldset>

        <div className="form-grid">
          <div>
            <input
              ref={(element) => {
                fieldRefs.current.name = element;
              }}
              type="text"
              name="name"
              placeholder="Your name (required)"
              value={formData.name}
              onChange={handleChange}
              className="field"
              required
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-2 text-sm font-bold text-rose-200" role="alert">
                {fieldErrors.name}
              </p>
            )}
          </div>
          <div>
            <input
              ref={(element) => {
                fieldRefs.current.location = element;
              }}
              type="text"
              name="location"
              placeholder="Location (required)"
              value={formData.location}
              onChange={handleChange}
              className="field"
              required
              aria-invalid={Boolean(fieldErrors.location)}
              aria-describedby={fieldErrors.location ? "location-error" : undefined}
            />
            {fieldErrors.location && (
              <p id="location-error" className="mt-2 text-sm font-bold text-rose-200" role="alert">
                {fieldErrors.location}
              </p>
            )}
          </div>
          <input
            ref={(element) => {
              fieldRefs.current.skills = element;
            }}
            type="text"
            name="skills"
            placeholder="Skills (optional): React, Growth, UX"
            value={formData.skills}
            onChange={handleChange}
            className="field"
          />
          <input
            ref={(element) => {
              fieldRefs.current.interests = element;
            }}
            type="text"
            name="interests"
            placeholder="Interests (optional): AI, SaaS, FinTech"
            value={formData.interests}
            onChange={handleChange}
            className="field"
          />
          <input
            ref={(element) => {
              fieldRefs.current.lookingFor = element;
            }}
            type="text"
            name="lookingFor"
            placeholder="Looking for (optional): Designer, Marketer"
            value={formData.lookingFor}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="github"
            placeholder="GitHub URL (optional)"
            value={formData.github}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="linkedin"
            placeholder="LinkedIn URL (optional)"
            value={formData.linkedin}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="portfolio"
            placeholder="Portfolio URL (optional)"
            value={formData.portfolio}
            onChange={handleChange}
            className="field md:col-span-2"
          />
        </div>

        <textarea
          ref={(element) => {
            fieldRefs.current.bio = element;
          }}
          name="bio"
          placeholder="Short bio (optional): share your background, strengths, and goals."
          value={formData.bio}
          onChange={handleChange}
          className="textarea mt-4"
        />

        {formError && (
          <p className="mt-4 rounded-lg border border-rose-300/30 bg-rose-300/10 p-3 text-sm font-bold text-rose-100" role="alert">
            {formError}
          </p>
        )}

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
