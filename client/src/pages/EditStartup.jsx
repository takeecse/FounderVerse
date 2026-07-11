import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaFloppyDisk,
} from "react-icons/fa6";
import {
  getStartupById,
  updateStartup,
} from "../api/startupApi";

const textToList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const listToText = (value) =>
  Array.isArray(value) ? value.join(", ") : "";

function EditStartup() {
  const { id } = useParams();
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

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await getStartupById(id);
        const startup = res.data;

        setFormData({
          title: startup.title || "",
          tagline: startup.tagline || "",
          description: startup.description || "",
          industry: startup.industry || "",
          techStack: listToText(startup.techStack),
          lookingFor: listToText(startup.lookingFor),
          website: startup.website || "",
          location: startup.location || "",
          stage: startup.stage || "Idea",
          fundingStatus:
            startup.fundingStatus || "Bootstrapped",
          fundingNeeded: startup.fundingNeeded || "",
          teamSize: startup.teamSize || 1,
          logo: startup.logo || "",
          isHiring: startup.isHiring ?? true,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchStartup();
  }, [id]);

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
      await updateStartup(id, {
        ...formData,
        teamSize: Number(formData.teamSize),
        techStack: textToList(formData.techStack),
        lookingFor: textToList(formData.lookingFor),
      });

      navigate(`/startups/${id}`);
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Failed to update startup"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="section-head">
        <div>
          <p className="eyebrow">Startup editor</p>
          <h1 className="page-title">
            Edit Startup
          </h1>
          <p className="page-subtitle">
            Keep your venture profile accurate as your team,
            traction, and needs evolve.
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
            value={formData.title}
            onChange={handleChange}
            className="field"
            placeholder="Startup name"
            required
          />
          <input
            name="tagline"
            value={formData.tagline}
            onChange={handleChange}
            className="field"
            placeholder="Tagline"
            required
          />
          <input
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="field"
            placeholder="Industry"
          />
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="field"
            placeholder="Location"
          />
          <input
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="field"
            placeholder="Website"
          />
          <input
            name="logo"
            value={formData.logo}
            onChange={handleChange}
            className="field"
            placeholder="Logo URL"
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
            value={formData.teamSize}
            onChange={handleChange}
            className="field"
            placeholder="Team size"
          />
          <input
            name="fundingNeeded"
            value={formData.fundingNeeded}
            onChange={handleChange}
            className="field"
            placeholder="Funding needed"
          />
          <input
            name="techStack"
            value={formData.techStack}
            onChange={handleChange}
            className="field md:col-span-2"
            placeholder="Tech stack"
          />
          <input
            name="lookingFor"
            value={formData.lookingFor}
            onChange={handleChange}
            className="field md:col-span-2"
            placeholder="Looking for"
          />
        </div>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="textarea mt-4"
          placeholder="Description"
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
          Currently hiring
        </label>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary mt-6"
        >
          <FaFloppyDisk />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

export default EditStartup;
