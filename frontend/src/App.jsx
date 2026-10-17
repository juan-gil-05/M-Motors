import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LegalMentions from './pages/LegalMentions';
import Unauthorized from './pages/Unauthorized';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import VehicleListPage from './pages/VehicleList';
import AdminVehicleList from './pages/AdminVehicleList';
import AdminApplications from './pages/AdminApplications';
import AddOrModifyVehicle from './pages/AddOrModifyVehicle';
import VehicleDetails from './pages/VehicleDetails';
import PersonalSpace from './pages/PersonalSpace';
import ApplicationTracking from './pages/ApplicationTracking';

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
            <Route path="/vehicules" element={<VehicleListPage />} />
            <Route path="/vehicule/:id" element={<VehicleDetails />} />
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/espace-personnel" element={<PersonalSpace />} />
              <Route path="/espace-personnel/dossiers/:id" element={<ApplicationTracking />} />
            
              {/* Only admin can acces to this routes */}
              <Route element={<AdminProtectedRoute />}>
                <Route path="/vehicule" element={<AddOrModifyVehicle />} ></Route>
                <Route path="/admin/vehicules" element={<AdminVehicleList />} ></Route>
                <Route path="/admin/dossiers" element={<AdminApplications />} ></Route>
              </Route>
            </Route>
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>

  );
}
