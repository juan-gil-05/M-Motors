import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import LegalMentions from './pages/LegalMentions';

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mentions-legales" element={<LegalMentions />} />
        </Routes>
      </Layout>
    </Router>
  );
}