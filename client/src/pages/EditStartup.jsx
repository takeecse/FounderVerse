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
  });

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await getStartupById(id);

        setFormData({
          title: res.data.title,
          tagline: res.data.tagline,
          description: res.data.description,
          industry: res.data.industry,
          techStack: res.data.techStack.join(", "),
          lookingFor: res.data.lookingFor.join(", "),
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchStartup();
  }, [id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
        techStack: formData.techStack
          .split(",")
          .map((item) => item.trim()),
        lookingFor: formData.lookingFor
          .split(",")
          .map((item) => item.trim()),
      });

      alert("Startup updated!");

    } catch (error) {
      console.error(error);
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