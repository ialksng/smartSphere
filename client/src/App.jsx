import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

// A simple wrapper component to check for the JWT token
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('sphere_token');
  if (!token) {
    // If no token exists, redirect to login
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
        
        {/* Protected Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;