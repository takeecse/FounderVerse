import { useState } from "react";
import { createStartup } from "../api/startupApi";

function CreateStartup() {
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    description: "",
    industry: "",
    techStack: "",
    lookingFor: "",
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
      await createStartup({
        title: formData.title,
        tagline: formData.tagline,
        description: formData.description,
        industry: formData.industry,
        techStack: formData.techStack
          .split(",")
          .map((item) => item.trim()),
        lookingFor: formData.lookingFor
          .split(",")
          .map((item) => item.trim()),
      });

      alert("Startup created!");

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
        className="bg-[#0B1225] p-8 rounded-2xl max-w-3xl"
      >
        <input
          name="title"
          placeholder="Startup Name"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="tagline"
          placeholder="Tagline"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="industry"
          placeholder="Industry"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="techStack"
          placeholder="React, Node.js, MongoDB"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          name="lookingFor"
          placeholder="Designer, Marketer"
          onChange={handleChange}
          className="w-full p-4 mb-6 rounded bg-gray-800"
        />

        <button
          type="submit"
          className="bg-cyan-500 px-6 py-3 rounded-xl"
        >
          Create Startup
        </button>
      </form>
    </div>
  );
}

export default CreateStartup;