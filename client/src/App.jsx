import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GoogleDriveHub from './pages/GoogleDriveHub';
import DocHub from './pages/DocHub';
import CloudHub from './pages/CloudHub';
import BuddyBot from './pages/BuddyBot';
import MyStorage from './pages/MyStorage';

import MainLayout from './layouts/MainLayout';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('sphere_token');
  return token ? children : <Navigate to="/auth" replace />;
};

const ProtectedLayout = ({ children }) => (
  <ProtectedRoute>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <BrowserRouter basename="/projects/smartsphere">
      <Routes>

        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          } 
        />

        <Route 
          path="/cloudhub" 
          element={
            <ProtectedLayout>
              <CloudHub />
            </ProtectedLayout>
          } 
        />

        <Route 
          path="/cloudhub/google" 
          element={
            <ProtectedLayout>
              <GoogleDriveHub />
            </ProtectedLayout>
          } 
        />

        <Route 
          path="/mystorage" 
          element={
            <ProtectedLayout>
              <MyStorage />
            </ProtectedLayout>
          } 
        />

        <Route 
          path="/dochub" 
          element={
            <ProtectedLayout>
              <DocHub />
            </ProtectedLayout>
          } 
        />

        <Route 
          path="/buddybot" 
          element={
            <ProtectedLayout>
              <BuddyBot />
            </ProtectedLayout>
          } 
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;