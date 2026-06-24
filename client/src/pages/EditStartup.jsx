import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getStartupById,
  updateStartup,
} from "../api/startupApi";

function EditStartup() {
  const { id } = useParams();

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
    isHiring: true,
  });

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await getStartupById(id);

        setFormData({
          title: res.data.title || "",
          tagline: res.data.tagline || "",
          description: res.data.description || "",
          industry: res.data.industry || "",

          techStack:
            res.data.techStack?.join(", ") || "",

          lookingFor:
            res.data.lookingFor?.join(", ") || "",

          website: res.data.website || "",
          location: res.data.location || "",
          stage: res.data.stage || "Idea",

          fundingStatus:
            res.data.fundingStatus ||
            "Bootstrapped",

          fundingNeeded:
            res.data.fundingNeeded || "",

          isHiring:
            res.data.isHiring ?? true,
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchStartup();
  }, [id]);

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

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
      await updateStartup(id, {
        title: formData.title,
        tagline: formData.tagline,
        description: formData.description,
        industry: formData.industry,

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

        lookingFor: formData.lookingFor
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      alert("Startup updated!");

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        "Failed to update startup"
      );
    }
  };

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Edit Startup
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-[#0B1225] p-8 rounded-2xl max-w-3xl"
      >
        <input
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="tagline"
          value={formData.tagline}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="Website"
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="location"
          value={formData.location}
          onChange={handleChange}
          placeholder="Location"
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <select
          name="stage"
          value={formData.stage}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
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
          className="w-full p-4 mb-4 rounded bg-gray-800"
        >
          <option>Bootstrapped</option>
          <option>Angel Funded</option>
          <option>Seed</option>
          <option>Series A</option>
          <option>Series B+</option>
        </select>

        <input
          name="fundingNeeded"
          value={formData.fundingNeeded}
          onChange={handleChange}
          placeholder="Funding Needed"
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <label className="flex gap-3 mb-6">
          <input
            type="checkbox"
            name="isHiring"
            checked={formData.isHiring}
            onChange={handleChange}
          />
          Currently Hiring
        </label>

        <input
          name="techStack"
          value={formData.techStack}
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="lookingFor"
          value={formData.lookingFor}
          onChange={handleChange}
          className="w-full p-4 mb-6 rounded bg-gray-800"
        />

        <button
          type="submit"
          className="bg-yellow-600 px-6 py-3 rounded-xl"
        >
          Save Changes
        </button>
      </form>

    </div>
  );
}

export default EditStartup;