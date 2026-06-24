import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaBell,
  FaRocket,
  FaUser,
  FaXmark,
} from "react-icons/fa6";
import { auth } from "../firebase";
import { clearSession, isAuthenticated } from "../utils/session";

const publicLinks = [
  { to: "/startups", label: "Startups" },
  { to: "/founders", label: "Founders" },
];

const privateLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/connections", label: "Connections" },
  { to: "/requests", label: "Requests" },
];

function Navbar() {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] =
    useState(null);
  const [loggedIn, setLoggedIn] = useState(
    isAuthenticated()
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseUser(user);
        setLoggedIn(isAuthenticated());
      }
    );

    const syncSession = () =>
      setLoggedIn(isAuthenticated());

    window.addEventListener(
      "storage",
      syncSession
    );

    return () => {
      unsubscribe();
      window.removeEventListener(
        "storage",
        syncSession
      );
    };
  }, []);

  const closeMenu = () => setOpen(false);

  const handleLogout = async () => {
    await signOut(auth).catch(() => {});
    clearSession();
    setLoggedIn(false);
    closeMenu();
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-bold transition ${
      isActive
        ? "bg-white/10 text-cyan-200"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  const authLinks = loggedIn
    ? privateLinks
    : [];

  return (
    <nav className="sticky top-0 z-50 px-4 py-4">
      <div className="glass-panel mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-3"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/12 text-cyan-200 shadow-lg shadow-cyan-950/40">
            <FaRocket />
          </span>
          <span className="text-xl font-black tracking-normal">
            Founder<span className="text-gradient">Verse</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <NavLink to="/" className={navClass}>
            Home
          </NavLink>
          {[...publicLinks, ...authLinks].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={navClass}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          {loggedIn ? (
            <>
              <Link
                to="/notifications"
                className="btn btn-secondary icon-btn"
                title="Notifications"
              >
                <FaBell />
              </Link>
              <Link
                to="/profile"
                className="btn btn-secondary"
              >
                {firebaseUser?.photoURL ? (
                  <img
                    src={firebaseUser.photoURL}
                    alt={firebaseUser.displayName || "Profile"}
                    className="h-7 w-7 rounded-md object-cover"
                  />
                ) : (
                  <FaUser />
                )}
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary icon-btn"
                title="Log out"
              >
                <FaArrowRightFromBracket />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-secondary"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
              >
                Join Now
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="btn btn-secondary icon-btn lg:hidden"
          title="Toggle navigation"
        >
          {open ? <FaXmark /> : <FaBars />}
        </button>
      </div>

      {open && (
        <div className="glass-panel mx-auto mt-3 flex max-w-7xl flex-col gap-2 p-3 lg:hidden">
          <NavLink
            to="/"
            onClick={closeMenu}
            className={navClass}
          >
            Home
          </NavLink>
          {[...publicLinks, ...authLinks].map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={navClass}
            >
              {link.label}
            </NavLink>
          ))}
          {loggedIn ? (
            <>
              <NavLink
                to="/profile"
                onClick={closeMenu}
                className={navClass}
              >
                Profile
              </NavLink>
              <NavLink
                to="/notifications"
                onClick={closeMenu}
                className={navClass}
              >
                Notifications
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                <FaArrowRightFromBracket />
                Log out
              </button>
            </>
          ) : (
            <div className="grid gap-2">
              <Link
                to="/login"
                onClick={closeMenu}
                className="btn btn-secondary"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className="btn btn-primary"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
