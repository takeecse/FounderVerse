import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-gray-800">

      <div className="max-w-7xl mx-auto flex justify-between items-center px-10 py-5">

        <h1 className="text-2xl font-black">
          FounderVerse 🚀
        </h1>

        <div className="flex gap-8 text-gray-300">
          <Link to="/">Home</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>

      </div>

    </nav>
  );
}

export default Navbar;