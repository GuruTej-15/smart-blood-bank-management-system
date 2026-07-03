import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLandingPath } from "../utils/constants";

export default function RoleRoute({ roles, children }) {
  const { user, initializing } = useAuth();

  if (initializing) return null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = String(user.role || "").trim().toLowerCase();
  if (roles && !roles.includes(normalizedRole)) {
    return <Navigate to={getLandingPath(normalizedRole)} replace />;
  }

  if (normalizedRole === "admin" && window.location.pathname === "/hospital-portal") {
    return <Navigate to="/admin-portal" replace />;
  }

  if (normalizedRole === "hospital" && window.location.pathname === "/admin-portal") {
    return <Navigate to="/hospital-portal" replace />;
  }

  return children;
}
