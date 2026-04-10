// client/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import GoogleDriveHub from './pages/GoogleDriveHub'; // <-- NEW IMPORT

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
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        {/* Public Route */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* NEW DEDICATED ROUTE */}
        <Route 
          path="/cloudhub/google" 
          element={
            <ProtectedRoute>
              <GoogleDriveHub />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;