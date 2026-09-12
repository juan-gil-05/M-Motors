import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LegalMentions from './pages/LegalMentions';
import Unauthorized from './pages/Unauthorized';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/Login';
import AddVehiclePage from './pages/AddVehicle';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inscription" element={< RegisterPage />} />
            <Route path="/connexion" element={< LoginPage />} />
            <Route path="/mentions-legales" element={<LegalMentions />} />
            <Route path="/non-autorise" element={<Unauthorized />} />
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
            
              {/* Only admin can acces to this routes */}
              <Route element={<AdminProtectedRoute />}>
                <Route path="/vehicules" element={<AddVehiclePage />} ></Route>
              </Route>
            </Route>
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>

  );
}