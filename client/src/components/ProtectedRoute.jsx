import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router";

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={"/login"} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={"/"} replace />;
  }

  return <Outlet />;
}
