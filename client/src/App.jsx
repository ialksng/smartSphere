import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';

function App() {
  return (
    <BrowserRouter basename="/projects/smartsphere">
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />
        {/* We will build the Dashboard next! */}
        <Route path="/dashboard" element={<div className="text-white text-center mt-20 text-2xl">Dashboard Coming Soon...</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;