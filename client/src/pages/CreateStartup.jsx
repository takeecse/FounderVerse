import { useState } from "react";
import { createStartup } from "../api/startupApi";
import { useNavigate } from "react-router-dom";

function CreateStartup() {
  const navigate = useNavigate();
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
      [name]:
        type === "checkbox"
          ? checked
          : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createStartup({
        title: formData.title,
        tagline: formData.tagline,
        description: formData.description,
        industry: formData.industry,

        teamSize: Number(formData.teamSize),
        logo: formData.logo,
        website: formData.website,
        location: formData.location,
        stage: formData.stage,
        fundingStatus:
          formData.fundingStatus,
        fundingNeeded:
          formData.fundingNeeded,
        isHiring: formData.isHiring,

        techStack: formData.techStack
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        lookingFor:
          formData.lookingFor
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
      });

      navigate("/my-startups");

      setFormData({
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

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Failed to create startup"
      );
    }
  };

  return (
    <div className="min-h-screen p-10">
      <h1 className="text-5xl font-bold mb-8">
        Create Startup
      </h1>

      <form
        onSubmit={handleSubmit}
        className="
        bg-[#0B1225]
        p-8
        rounded-2xl
        max-w-4xl
        "
      >
        <input
          name="title"
          placeholder="Startup Name"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="tagline"
          placeholder="Tagline"
          value={formData.tagline}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <textarea
          name="description"
          placeholder="Describe your startup..."
          value={formData.description}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800 min-h-[140px]"
        />

        <input
          name="industry"
          placeholder="Industry"
          value={formData.industry}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="website"
          placeholder="Website URL"
          value={formData.website}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          type="number"
          name="teamSize"
          placeholder="Current Team Size"
          value={formData.teamSize}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="logo"
          placeholder="Logo URL"
          value={formData.logo}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <select
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            className="p-4 rounded bg-gray-800"
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
            className="p-4 rounded bg-gray-800"
          >
            <option>Bootstrapped</option>
            <option>Angel Funded</option>
            <option>Seed</option>
            <option>Series A</option>
            <option>Series B+</option>
          </select>
        </div>

        <input
          name="fundingNeeded"
          placeholder="Funding Needed (Optional)"
          value={formData.fundingNeeded}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="techStack"
          placeholder="React, Node.js, MongoDB"
          value={formData.techStack}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="lookingFor"
          placeholder="Designer, Marketer, Backend Developer"
          value={formData.lookingFor}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <label className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            name="isHiring"
            checked={formData.isHiring}
            onChange={handleChange}
          />
          Currently Hiring Team Members
        </label>

        <button
          type="submit"
          className="
          bg-cyan-500
          px-8
          py-3
          rounded-xl
          font-semibold
          hover:bg-cyan-600
          "
        >
          Create Startup
        </button>
      </form>
    </div>
  );
}

export default CreateStartup;