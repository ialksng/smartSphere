import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Cloud, Bot, Loader2, Plus
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/projects/smartsphere/api/dochub', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        }
      });

      const data = await res.json();
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8">

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back 👋</h1>
          <p className="text-gray-400 text-sm">
            Your AI-powered cloud workspace
          </p>
        </div>

        <button
          onClick={() => navigate('/dochub')}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl hover:opacity-90"
        >
          <Plus size={16} />
          New Document
        </button>
      </div>

      {/* 🔥 STATS */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard title="Documents" value={docs.length} icon={<FileText />} />
        <StatCard title="AI Chats" value="24" icon={<Bot />} />
        <StatCard title="Storage Used" value="128 MB" icon={<Cloud />} />
      </div>

      {/* 🔥 QUICK ACTIONS */}
      <div className="grid md:grid-cols-3 gap-6">

        <ActionCard
          icon={<Cloud />}
          title="Import from Cloud"
          desc="Google Drive, OneDrive, Dropbox"
          onClick={() => navigate('/cloudhub')}
        />

        <ActionCard
          icon={<FileText />}
          title="Open DocHub"
          desc="View and edit documents"
          onClick={() => navigate('/dochub')}
        />

        <ActionCard
          icon={<Bot />}
          title="Ask BuddyBot"
          desc="Chat with your documents"
          onClick={() => navigate('/buddybot')}
        />

      </div>

      {/* 🔥 RECENT DOCUMENTS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Documents</h2>
          <button
            onClick={() => navigate('/dochub')}
            className="text-sm text-gray-400 hover:text-white"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-gray-500 text-center py-10">
            No documents yet. Import from CloudHub.
          </div>
        ) : (
          <div className="space-y-3">
            {docs.slice(0, 5).map(doc => (
              <div
                key={doc._id}
                onClick={() =>
                  navigate('/dochub', { state: { docId: doc._id } })
                }
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10 transition"
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium">{doc.filename}</p>
                  <span className="text-xs text-gray-500">Open</span>
                </div>

                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {doc.summary || "No summary available"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// 🔹 STAT CARD
function StatCard({ title, value, icon }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-xl font-semibold mt-1">{value}</h2>
      </div>
      <div className="text-gray-300">{icon}</div>
    </div>
  );
}

// 🔹 ACTION CARD
function ActionCard({ icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition"
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
  );
}