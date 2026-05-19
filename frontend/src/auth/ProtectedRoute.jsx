import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Loader from "../components/common/Loader";

const ProtectedRoute = ({ children, permission }) => {
  const { loading, isAuthenticated, hasPermission } = useAuth();

  if (loading) {
    return <Loader fullPage text="Checking access..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/portal-selection" replace />;
  }

  return children;
};

export default ProtectedRoute;