import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLandingPath } from "../utils/constants";

export default function RoleLanding() {
  const { user, initializing } = useAuth();

  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={getLandingPath(user.role)} replace />;
}