import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLandingPath } from "../utils/constants";

export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getLandingPath(user.role)} replace />;
  }

  return children;
}
