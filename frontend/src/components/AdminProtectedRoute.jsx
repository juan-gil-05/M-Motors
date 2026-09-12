import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner'

const AdminProtectedRoute = () => {
  const { isAdmin, loading } = useAuth();

  // Show spinner while checking if user is admin
  if (loading) {
    return <LoadingSpinner fullPage text="Vérification des authorisations..." />;
  }

  // If not admin, redirect to Unauthorized page
  if (!isAdmin) {
    return <Navigate to="/non-autorise" replace />;
  }

  // If authenticated, render child components (routes)
  return <Outlet />;
};

export default AdminProtectedRoute;