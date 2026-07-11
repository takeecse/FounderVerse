import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaRocket,
} from "react-icons/fa6";
import { createStartup } from "../api/startupApi";

const textToList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

function CreateStartup() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    description: "",
    industry: "",
    techStack: "",
    lookingFor: "",
    website: "",
    location: "",
    stage: "Idea",
    fundingStatus: "Bootstrapped",
    fundingNeeded: "",
    teamSize: 1,
    logo: "",
    isHiring: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await createStartup({
        ...formData,
        teamSize: Number(formData.teamSize),
        techStack: textToList(formData.techStack),
        lookingFor: textToList(formData.lookingFor),
      });

      navigate("/my-startups");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to create startup"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">New venture</p>
          <h1 className="page-title">
            Create Startup
          </h1>
          <p className="page-subtitle">
            Give collaborators the context they need to
            understand your idea, traction, and team needs.
          </p>
        </div>
        <Link
          to="/my-startups"
          className="btn btn-secondary"
        >
          <FaArrowLeft />
          My Startups
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass-panel p-6 sm:p-8"
      >
        <div className="form-grid">
          <input
            name="title"
            placeholder="Startup Name"
            value={formData.title}
            onChange={handleChange}
            className="field"
            required
          />
          <input
            name="tagline"
            placeholder="Tagline"
            value={formData.tagline}
            onChange={handleChange}
            className="field"
            required
          />
          <input
            name="industry"
            placeholder="Industry"
            value={formData.industry}
            onChange={handleChange}
            className="field"
          />
          <input
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
            className="field"
          />
          <input
            name="website"
            placeholder="Website URL"
            value={formData.website}
            onChange={handleChange}
            className="field"
          />
          <input
            name="logo"
            placeholder="Logo URL"
            value={formData.logo}
            onChange={handleChange}
            className="field"
          />
          <select
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            className="select"
          >
            <option>Idea</option>
            <option>MVP</option>
            <option>Beta</option>
            <option>Growth</option>
            <option>Scaling</option>
          </select>
          <select
            name="fundingStatus"
            value={formData.fundingStatus}
            onChange={handleChange}
            className="select"
          >
            <option>Bootstrapped</option>
            <option>Angel Funded</option>
            <option>Seed</option>
            <option>Series A</option>
            <option>Series B+</option>
          </select>
          <input
            type="number"
            min="1"
            name="teamSize"
            placeholder="Current Team Size"
            value={formData.teamSize}
            onChange={handleChange}
            className="field"
          />
          <input
            name="fundingNeeded"
            placeholder="Funding Needed"
            value={formData.fundingNeeded}
            onChange={handleChange}
            className="field"
          />
          <input
            name="techStack"
            placeholder="Tech stack: React, Node, MongoDB"
            value={formData.techStack}
            onChange={handleChange}
            className="field md:col-span-2"
          />
          <input
            name="lookingFor"
            placeholder="Looking for: Designer, Marketer, Investor"
            value={formData.lookingFor}
            onChange={handleChange}
            className="field md:col-span-2"
          />
        </div>

        <textarea
          name="description"
          placeholder="Describe your startup..."
          value={formData.description}
          onChange={handleChange}
          className="textarea mt-4"
          required
        />

        <label className="mt-5 flex items-center gap-3 text-sm font-bold text-slate-300">
          <input
            type="checkbox"
            name="isHiring"
            checked={formData.isHiring}
            onChange={handleChange}
            className="h-5 w-5 accent-cyan-300"
          />
          Currently hiring team members
        </label>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary mt-6"
        >
          <FaRocket />
          {saving ? "Creating..." : "Create Startup"}
        </button>
      </form>
    </div>
  );
}

export default CreateStartup;
