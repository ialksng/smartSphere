import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GoogleDriveHub from './pages/GoogleDriveHub';
import DocHub from './pages/DocHub';
import CloudHub from './pages/CloudHub';        // 🔥 NEW
import BuddyBot from './pages/BuddyBot';        // 🔥 NEW

import MainLayout from './layouts/MainLayout';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('sphere_token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter basename="/projects/smartsphere">
      <Routes>

        {/* Default */}
        <Route path="/" element={<Navigate to="/auth" replace />} />

        {/* Public */}
        <Route path="/auth" element={<Auth />} />

        {/* 🔥 PROTECTED ROUTES WITH LAYOUT */}

        {/* Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* 🔥 CLOUD HUB MAIN PAGE */}
        <Route 
          path="/cloudhub" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <CloudHub />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Google Drive */}
        <Route 
          path="/cloudhub/google" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <GoogleDriveHub />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* DocHub */}
        <Route 
          path="/dochub" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <DocHub />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* 🔥 BUDDYBOT */}
        <Route 
          path="/buddybot" 
          element={
            <ProtectedRoute>
              <MainLayout>
                <BuddyBot />
              </MainLayout>
            </ProtectedRoute>
          } 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;