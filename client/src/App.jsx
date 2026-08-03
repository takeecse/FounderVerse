import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
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
import Chat from "./pages/Chat";
import Connections from "./pages/Connections";
import Navbar from "./components/Navbar";
import OnboardingGate from "./components/OnboardingGate";
import RequireAuth from "./components/RequireAuth";

const privatePage = (page) => (
  <RequireAuth>{page}</RequireAuth>
);

function AppLayout() {
  const location = useLocation();
  const isProfileCompletion =
    location.pathname === "/complete-profile";

  return (
    <div
      className={`app-shell ${
        isProfileCompletion ? "onboarding-mode" : ""
      }`}
    >
      {!isProfileCompletion && <Navbar />}
      <main>
        <OnboardingGate>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={privatePage(<Dashboard />)}
            />
            <Route
              path="/profile"
              element={privatePage(<Profile />)}
            />
            <Route
              path="/edit-profile"
              element={privatePage(<EditProfile />)}
            />
            <Route
              path="/complete-profile"
              element={privatePage(<EditProfile />)}
            />
            <Route
              path="/create-startup"
              element={privatePage(<CreateStartup />)}
            />
            <Route path="/startups" element={<Startups />} />
            <Route
              path="/my-startups"
              element={privatePage(<MyStartups />)}
            />
            <Route
              path="/startups/:id"
              element={<StartupDetails />}
            />
            <Route path="/founders" element={<Founders />} />
            <Route
              path="/founders/:id"
              element={<FounderDetails />}
            />
            <Route
              path="/requests"
              element={privatePage(<Requests />)}
            />
            <Route
              path="/sent-requests"
              element={privatePage(<SentRequests />)}
            />
            <Route
              path="/edit-startup/:id"
              element={privatePage(<EditStartup />)}
            />
            <Route
              path="/connections"
              element={privatePage(<Connections />)}
            />
            <Route
              path="/notifications"
              element={privatePage(<Notifications />)}
            />
            <Route
              path="/chat"
              element={privatePage(<Chat />)}
            />
            <Route
              path="/chat/:userId"
              element={privatePage(<Chat />)}
            />
          </Routes>
        </OnboardingGate>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
