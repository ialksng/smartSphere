import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Cloud, Bot, Loader2, Plus, Search, Star } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    docs: 0,
    favorites: 0,
    chats: 0,
    storage: "0 MB"
  });

  const token = localStorage.getItem('sphere_token');

  useEffect(() => {
    fetchDocs();
    fetchStats();
  }, []);

  useEffect(() => {
    if (!search) return;

    const delay = setTimeout(() => {
      navigate(`/dochub?search=${search}`);
    }, 500);

    return () => clearTimeout(delay);
  }, [search, navigate]);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`/projects/smartsphere/api/dochub`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setDocs(data.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/projects/smartsphere/api/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch('/projects/smartsphere/api/ai/upload', {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      fetchDocs();
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="min-h-screen p-8 text-white space-y-8"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        background: "radial-gradient(circle at top, #0f172a, #020617)"
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back 👋</h1>
          <p className="text-gray-400 text-sm">
            SmartSphere AI Workspace
          </p>
        </div>

        <button
          onClick={() => navigate('/dochub')}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl"
        >
          <Plus size={16} />
          New Document
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search across all documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 p-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:ring-1 focus:ring-white/30"
        />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <StatCard title="Documents" value={stats.docs || 0} icon={<FileText />} />
        <StatCard title="Favorites" value={stats.favorites || 0} icon={<Star />} />
        <StatCard title="AI Chats" value={stats.chats || 0} icon={<Bot />} />
        <StatCard title="Storage" value={stats.storage || "0 MB"} icon={<Cloud />} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <ActionCard
          icon={<Cloud />}
          title="CloudHub"
          desc="Import from Google Drive"
          onClick={() => navigate('/cloudhub')}
        />

        <ActionCard
          icon={<FileText />}
          title="Open DocHub"
          desc="Manage your documents"
          onClick={() => navigate('/dochub')}
        />

        <ActionCard
          icon={<Bot />}
          title="BuddyBot"
          desc="Chat with your files"
          onClick={() => navigate('/buddybot')}
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Documents</h2>

          <button
            onClick={() => navigate('/dochub')}
            className="text-sm text-gray-400 hover:text-white"
          >
            View all →
          </button>
        </div>

        {loading ? (
          <Loader2 className="animate-spin mx-auto mt-4" />
        ) : docs.length === 0 ? (
          <p className="text-gray-400 text-center mt-4">No documents yet</p>
        ) : (
          <div className="space-y-3 mt-4">
            {docs.map(doc => (
              <div
                key={doc._id}
                onClick={() =>
                  navigate('/dochub', { state: { docId: doc._id } })
                }
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10 transition-colors"
              >
                <p className="font-medium">{doc.filename}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-1">
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

function StatCard({ title, value, icon }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center transition-all hover:bg-white/10">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-xl font-semibold mt-1">{value}</h2>
      </div>
      <div className="text-gray-400">
        {icon}
      </div>
    </div>
  );
}

function ActionCard({ icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all hover:-translate-y-1"
    >
      <div className="mb-3 text-white">{icon}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{desc}</p>
    </div>
  );
}