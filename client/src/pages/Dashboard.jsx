import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { FileText, BrainCircuit, HardDrive, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const res = await fetch('/projects/smartsphere/api/ai/insights', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        }
      });

      const data = await res.json();
      setInsights(data);

    } catch (error) {
      console.error("Failed to fetch insights", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="flex h-full">

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto">

        {/* HEADER */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-gray-400 text-sm">
            Your AI-powered document workspace
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard 
            title="Documents" 
            value={insights.length} 
            icon={<FileText size={20} />} 
          />
          <StatCard 
            title="Insights" 
            value={insights.length * 3} 
            icon={<BrainCircuit size={20} />} 
          />
          <StatCard 
            title="Storage" 
            value="Local" 
            icon={<HardDrive size={20} />} 
          />
        </div>

        {/* INSIGHTS */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Documents</h3>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin" />
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No documents yet. Import from Drive to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map(doc => (
                <div
                  key={doc._id}
                  onClick={() => navigate('/dochub', { state: { docId: doc._id } })}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10"
                >
                  <p className="font-medium">{doc.filename}</p>
                  <p className="text-sm text-gray-400">
                    {doc.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* AI PANEL */}
      <div className="w-[350px] border-l border-white/10 p-4">
        <ChatInterface onInsightAdded={fetchInsights} />
      </div>

    </div>
  );
}

// COMPONENTS
function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}