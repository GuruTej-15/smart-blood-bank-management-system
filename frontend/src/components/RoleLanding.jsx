import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLandingPath } from "../utils/constants";

export default function RoleLanding() {
  const { user, initializing } = useAuth();

  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;

  const normalizedRole = String(user.role || "").trim().toLowerCase();
  return <Navigate to={getLandingPath(normalizedRole)} replace />;
}