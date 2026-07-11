import { useCallback, useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaBell,
  FaComments,
  FaRocket,
  FaUser,
} from "react-icons/fa6";
import { auth } from "../firebase";
import { clearSession, isAuthenticated } from "../utils/session";
import { getProfile } from "../api/userApi";
import { getConversations } from "../api/chatApi";
import socket, { connectSocket } from "../socket";

const publicLinks = [
  { to: "/startups", label: "Startups" },
  { to: "/founders", label: "Founders" },
];

const privateLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/requests", label: "Requests" },
];

function Navbar() {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] =
    useState(null);
  const [profile, setProfile] = useState(null);
  const [unreadChats, setUnreadChats] = useState(0);
  const [loggedIn, setLoggedIn] = useState(
    isAuthenticated()
  );
  const [open, setOpen] = useState(false);

  const loadPrivateNavData = useCallback(async () => {
    if (!isAuthenticated()) {
      setProfile(null);
      setUnreadChats(0);
      return;
    }

    try {
      const [profileRes, conversationsRes] =
        await Promise.all([
          getProfile(),
          getConversations(),
        ]);

      setProfile(profileRes.data);
      setUnreadChats(
        conversationsRes.data.reduce(
          (total, item) => total + (item.unreadCount || 0),
          0
        )
      );
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseUser(user);
        setLoggedIn(isAuthenticated());
        loadPrivateNavData();
      }
    );

    const syncSession = () => {
      setLoggedIn(isAuthenticated());
      loadPrivateNavData();
    };

    window.addEventListener(
      "storage",
      syncSession
    );
    window.addEventListener(
      "founderverse:profile-updated",
      loadPrivateNavData
    );
    window.addEventListener(
      "founderverse:chat-updated",
      loadPrivateNavData
    );

    return () => {
      unsubscribe();
      window.removeEventListener(
        "storage",
        syncSession
      );
      window.removeEventListener(
        "founderverse:profile-updated",
        loadPrivateNavData
      );
      window.removeEventListener(
        "founderverse:chat-updated",
        loadPrivateNavData
      );
    };
  }, [loadPrivateNavData]);

  useEffect(() => {
    if (!loggedIn) return undefined;

    connectSocket();

    const refreshChatBadge = () => {
      loadPrivateNavData();
    };

    socket.on("receive_message", refreshChatBadge);
    socket.on("messages_read", refreshChatBadge);

    return () => {
      socket.off("receive_message", refreshChatBadge);
      socket.off("messages_read", refreshChatBadge);
    };
  }, [loggedIn, loadPrivateNavData]);

  const closeMenu = () => setOpen(false);

  const handleLogout = async () => {
    await signOut(auth).catch(() => {});
    clearSession();
    setLoggedIn(false);
    setProfile(null);
    setUnreadChats(0);
    closeMenu();
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
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
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200 shadow-lg shadow-cyan-950/40">
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
              <div
                id="desktop-account-navigation"
                className={`flex items-center gap-3 overflow-hidden transition-all duration-200 ease-out ${
                  open
                    ? "max-w-0 opacity-0"
                    : "max-w-[560px] opacity-100"
                }`}
              >
                <Link
                  to="/chat"
                  className="btn btn-secondary relative whitespace-nowrap"
                  title="Chat"
                >
                  <FaComments />
                  Chat
                  {unreadChats > 0 && (
                    <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-black text-white">
                      {unreadChats}
                    </span>
                  )}
                </Link>
                <Link
                  to="/notifications"
                  className="btn btn-secondary icon-btn"
                  title="Notifications"
                >
                  <FaBell />
                </Link>
                <Link
                  to="/profile"
                  className="btn btn-secondary whitespace-nowrap"
                >
                  {profile?.photoURL || firebaseUser?.photoURL ? (
                    <img
                      src={
                        profile?.photoURL ||
                        firebaseUser.photoURL
                      }
                      alt={
                        profile?.name ||
                        firebaseUser.displayName ||
                        "Profile"
                      }
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
              </div>
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="btn btn-secondary icon-btn relative"
                title="Toggle account navigation"
                aria-expanded={!open}
                aria-controls="desktop-account-navigation"
              >
                <FaBars />
                {open && unreadChats > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-black text-white">
                    {unreadChats}
                  </span>
                )}
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
          className="nav-toggle nav-toggle-mobile"
          title="Toggle navigation"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <FaBars />
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`glass-panel mx-auto flex max-w-7xl flex-col gap-2 overflow-hidden p-3 transition-all duration-200 ease-out lg:hidden ${
          open
            ? "mt-3 max-h-[720px] opacity-100"
            : "max-h-0 border-transparent py-0 opacity-0"
        }`}
      >
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
                to="/chat"
                onClick={closeMenu}
                className={navClass}
              >
                Chat
                {unreadChats > 0 && (
                  <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                    {unreadChats}
                  </span>
                )}
              </NavLink>
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
    </nav>
  );
}

export default Navbar;
