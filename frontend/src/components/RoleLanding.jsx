import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getLandingPath } from "../utils/constants";

export default function RoleLanding() {
  const { user } = useAuth();
  return <Navigate to={getLandingPath(user?.role)} replace />;
}