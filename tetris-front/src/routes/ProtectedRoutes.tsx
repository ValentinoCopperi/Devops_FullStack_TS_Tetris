import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuth";
import type { Roles } from "../types/auth";

interface Props {
  children: React.ReactNode;
  roles: Roles[];
}

const ProtectedRoute = ({ children, roles }: Props) => {
  const { user, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;
 
  if (!user) return <Navigate to="/login" replace />;
  
  if (!roles.some((role) => user.role.includes(role))) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
