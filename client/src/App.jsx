import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import CreateStartup from "./pages/CreateStartup";
import Startups from "./pages/Startups";
import MyStartups from "./pages/MyStartups";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/create-startup" element={<CreateStartup />} />
        <Route path="/startups" element={<Startups />} />
        <Route
          path="/my-startups"
          element={<MyStartups />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;