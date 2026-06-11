import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { registerUser } from "../api/authApi";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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
      const res = await registerUser(formData);

      alert(res.data.message);

      setFormData({
        name: "",
        email: "",
        password: "",
      });

    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Registration failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          <h1 className="text-4xl font-bold text-center mb-2">
            Create Account
          </h1>

          <p className="text-center text-gray-400 mb-8">
            Join FounderVerse and start building.
          </p>

          <form onSubmit={handleSubmit}>

            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-4 mb-4 rounded-xl bg-black/20 border border-gray-700 focus:outline-none focus:border-cyan-400"
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 mb-4 rounded-xl bg-black/20 border border-gray-700 focus:outline-none focus:border-cyan-400"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 mb-6 rounded-xl bg-black/20 border border-gray-700 focus:outline-none focus:border-cyan-400"
            />

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 font-semibold hover:scale-[1.02] transition"
            >
              Create Account
            </button>

          </form>

          <p className="text-center text-gray-400 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-cyan-400 hover:underline"
            >
              Login
            </Link>
          </p>

        </div>

      </motion.div>

    </div>
  );
}

export default Register;