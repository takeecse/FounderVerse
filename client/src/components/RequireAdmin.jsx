import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/session";

function RequireAdmin({ children, profile }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!profile?.isAdmin && !profile?.isSystem) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RequireAdmin;
