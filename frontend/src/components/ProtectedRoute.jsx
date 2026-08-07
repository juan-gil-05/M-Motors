import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner'

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show spinner while checking local storage on app load
  if (loading) {
    return <LoadingSpinner fullPage text="Vérification de la session..." />;
  }

  // If not authenticated, redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />;
  }

  // If authenticated, render child components (routes)
  return <Outlet />;
};

export default ProtectedRoute;