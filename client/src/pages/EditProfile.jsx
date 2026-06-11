import { useState } from "react";
import { updateProfile } from "../api/userApi";
import { useNavigate } from "react-router-dom";

function EditProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bio: "",
    skills: "",
    github: "",
    linkedin: "",
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
      await updateProfile({
        bio: formData.bio,
        github: formData.github,
        linkedin: formData.linkedin,
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim()),
      });

      alert("Profile updated successfully");

      navigate("/profile");

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Update failed"
      );
    }
  };

  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Edit Profile
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-[#0B1225] p-8 rounded-2xl max-w-3xl"
      >

        <input
          type="text"
          name="bio"
          placeholder="Bio"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          type="text"
          name="skills"
          placeholder="Skills (comma separated)"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          type="text"
          name="github"
          placeholder="GitHub URL"
          onChange={handleChange}
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          type="text"
          name="linkedin"
          placeholder="LinkedIn URL"
          onChange={handleChange}
          className="w-full p-4 mb-6 rounded bg-gray-800"
        />

        <button
          type="submit"
          className="bg-cyan-500 px-6 py-3 rounded-xl"
        >
          Save Profile
        </button>

      </form>

    </div>
  );
}

export default EditProfile;