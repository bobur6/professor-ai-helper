import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentView from './pages/DocumentView';
import MyClasses from './pages/MyClasses';
import ClassDetail from './pages/ClassDetail';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

function AppContent() {
  const location = useLocation();
  const [dashboardMode, setDashboardMode] = useState(() => {
    return localStorage.getItem('dashboardMode') || 'quick';
  });

  const handleModeChange = (newMode) => {
    setDashboardMode(newMode);
    localStorage.setItem('dashboardMode', newMode);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar 
        mode={location.pathname === '/dashboard' ? dashboardMode : null}
        onModeChange={handleModeChange}
      />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route 
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/documents/:documentId"
            element={
              <ProtectedRoute>
                <DocumentView />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/classes"
            element={
              <ProtectedRoute>
                <MyClasses />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/classes/:classId"
            element={
              <ProtectedRoute>
                <ClassDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
