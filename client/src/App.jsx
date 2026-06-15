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
import StartupDetails from "./pages/StartupDetails";
import Founders from "./pages/Founders";
import FounderDetails from "./pages/FounderDetails";
import Requests from "./pages/Requests";
import SentRequests from "./pages/SentRequests";
import EditStartup from "./pages/EditStartup";
import Notifications from "./pages/Notifications";

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
        <Route
          path="/startups/:id"
          element={<StartupDetails />}
        />
        <Route
          path="/founders"
          element={<Founders />}
        />
        <Route
          path="/founders/:id"
          element={<FounderDetails />}
        />
        <Route
          path="/requests"
          element={<Requests />}
        />
        <Route
          path="/sent-requests"
          element={<SentRequests />}
        />
        <Route
          path="/edit-startup/:id"
          element={<EditStartup />}
        />
        <Route
          path="/notifications"
          element={<Notifications />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;