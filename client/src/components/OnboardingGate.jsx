import { useEffect, useState } from "react";
import {
  Navigate,
  useLocation,
} from "react-router-dom";
import { getProfile } from "../api/userApi";
import {
  clearSession,
  isAuthenticated,
} from "../utils/session";

const onboardingPaths = [
  "/complete-profile",
];

function OnboardingGate({ children }) {
  const location = useLocation();
  const authenticated = isAuthenticated();
  const [checking, setChecking] = useState(authenticated);
  const [profileCompleted, setProfileCompleted] =
    useState(null);

  useEffect(() => {
    let mounted = true;

    const isProfileComplete = (profile) =>
      Boolean(
        profile?.profileCompleted ||
          ((profile?.isAdmin || profile?.isSystem) &&
            ["/admin", "/system"].some((path) =>
              location.pathname.startsWith(path)
            ))
      );

    const checkProfile = async () => {
      if (!isAuthenticated()) {
        if (mounted) {
          setChecking(false);
          setProfileCompleted(null);
        }

        return;
      }

      try {
        setChecking(true);
        const res = await getProfile();

        if (mounted) {
          setProfileCompleted(isProfileComplete(res.data));
        }
      } catch (error) {
        console.error(error);
        clearSession();

        if (mounted) {
          setProfileCompleted(null);
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    };

    const handleProfileUpdated = (event) => {
      if (event.detail) {
        setProfileCompleted(isProfileComplete(event.detail));
        setChecking(false);
        return;
      }

      checkProfile();
    };

    checkProfile();

    window.addEventListener(
      "storage",
      checkProfile
    );
    window.addEventListener(
      "founderverse:profile-updated",
      handleProfileUpdated
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        "storage",
        checkProfile
      );
      window.removeEventListener(
        "founderverse:profile-updated",
        handleProfileUpdated
      );
    };
  }, [authenticated, location.pathname]);

  if (!authenticated) {
    return children;
  }

  if (checking) {
    return (
      <div className="page-shell flex min-h-[50vh] items-center justify-center text-slate-300">
        Loading...
      </div>
    );
  }

  if (
    profileCompleted === false &&
    !onboardingPaths.includes(location.pathname)
  ) {
    return (
      <Navigate
        to="/complete-profile"
        replace
      />
    );
  }

  return children;
}

export default OnboardingGate;
