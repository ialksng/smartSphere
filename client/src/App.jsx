import { useEffect, useState } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState('Checking API...');

  useEffect(() => {
    // Because client and server are on the same origin, we just hit /api/...
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setApiStatus(data.message))
      .catch(() => setApiStatus('API is unreachable'));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-glassBg border border-glassBorder p-8 rounded-2xl shadow-2xl backdrop-blur-md text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Smart Sphere
        </h1>
        <p className="text-gray-300 mb-6">AI Cloud Intelligence Platform</p>
        
        <div className="bg-white/5 rounded-lg p-4 font-mono text-sm border border-white/10">
          Backend Status: <span className="text-emerald-400">{apiStatus}</span>
        </div>
      </div>
    </div>
  )
}

export default App;