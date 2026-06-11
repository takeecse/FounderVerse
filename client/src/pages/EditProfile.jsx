function EditProfile() {
  return (
    <div className="min-h-screen p-10">

      <h1 className="text-5xl font-bold mb-8">
        Edit Profile
      </h1>

      <div className="bg-[#0B1225] p-8 rounded-2xl max-w-3xl">

        <input
          placeholder="Bio"
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          placeholder="Skills (comma separated)"
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          placeholder="GitHub URL"
          className="w-full p-4 mb-4 rounded bg-gray-800"
        />

        <input
          placeholder="LinkedIn URL"
          className="w-full p-4 mb-6 rounded bg-gray-800"
        />

        <button className="bg-cyan-500 px-6 py-3 rounded-xl">
          Save Profile
        </button>

      </div>

    </div>
  );
}

export default EditProfile;