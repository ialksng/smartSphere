import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GoogleDriveHub from './pages/GoogleDriveHub'; 
import DocHub from './pages/DocHub';

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

        {/* Protected */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Google Drive */}
        <Route 
          path="/cloudhub/google" 
          element={
            <ProtectedRoute>
              <GoogleDriveHub />
            </ProtectedRoute>
          } 
        />

        {/* 🔥 DOCHUB (NEW) */}
        <Route 
          path="/dochub" 
          element={
            <ProtectedRoute>
              <DocHub />
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