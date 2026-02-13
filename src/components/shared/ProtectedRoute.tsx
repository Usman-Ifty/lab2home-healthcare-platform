import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: "patient" | "lab" | "phlebotomist" | "admin";
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();

  console.log('🛡️ ProtectedRoute check:', { 
    isAuthenticated, 
    userRole: user?.role, 
    allowedRole,
    loading 
  });

  // Show nothing while loading
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    console.log(`❌ Wrong role! User is ${user?.role}, but route requires ${allowedRole}`);
    console.log(`🔀 Redirecting to: /${user?.role}`);
    return <Navigate to={`/${user?.role}`} replace />;
  }

  console.log('✅ Access granted to', allowedRole, 'route');
  return <>{children}</>;
};

export default ProtectedRoute;

