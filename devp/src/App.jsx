import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import CreateCase from './pages/CreateCase';
import CaseDetails from './pages/CaseDetails';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import { AuthProvider, useAuth } from './utils/AuthContext';
import './styles/App.css';
import './styles/globals.css';

const App = () => {
    
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-gray-100 app-container">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2 className="loading-title">Missing Alert</h2>
          <p className="loading-text">Loading community-powered missing alert system...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}
      <main className={`main-content ${user ? 'authenticated' : 'guest'}`}>
        <Routes>
          <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/cases" element={user ? <Cases /> : <Navigate to="/auth" />} />
          <Route path="/cases/create" element={user ? <CreateCase /> : <Navigate to="/auth" />} />
          <Route path="/cases/:id" element={user ? <CaseDetails /> : <Navigate to="/auth" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
};

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="not-found-icon">🚨</div>
        <h1 className="not-found-title">404 - Page Not Found</h1>
        <p className="not-found-text">The page you're looking for doesn't exist in the Missing Alert System.</p>
        <a href="/" className="btn-primary">
          ← Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default App;