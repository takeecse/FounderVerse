import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFloppyDisk } from "react-icons/fa6";
import {
  getProfile,
  updateProfile,
} from "../api/userApi";

const listToText = (value) =>
  Array.isArray(value) ? value.join(", ") : "";

const textToList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function EditProfile() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
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
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        const user = res.data;

        setFormData({
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await updateProfile({
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

      navigate("/profile");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Update failed"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Founder identity</p>
          <h1 className="page-title">
            Edit Profile
          </h1>
          <p className="page-subtitle">
            Keep your skills, links, and collaboration intent
            sharp so the right people understand where you fit.
          </p>
        </div>
        <Link to="/profile" className="btn btn-secondary">
          <FaArrowLeft />
          Back
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel p-6 sm:p-8"
      >
        <div className="form-grid">
          <input
            type="text"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="skills"
            placeholder="Skills: React, Growth, UX"
            value={formData.skills}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="interests"
            placeholder="Interests: AI, SaaS, FinTech"
            value={formData.interests}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="lookingFor"
            placeholder="Looking for: Designer, Marketer"
            value={formData.lookingFor}
            onChange={handleChange}
            className="field"
          />
          <input
            type="text"
            name="photoURL"
            placeholder="Profile photo URL"
            value={formData.photoURL}
            onChange={handleChange}
            className="field"
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
        />

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary mt-6"
        >
          <FaFloppyDisk />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
}

export default EditProfile;
