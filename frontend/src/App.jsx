import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LegalMentions from './pages/LegalMentions';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
            </Route>
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>

  );
}