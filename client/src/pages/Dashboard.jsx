import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Cloud, Bot, Loader2, Plus, Search, Upload, Star
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    docs: 0,
    chats: 0,
    storage: "0 MB",
    favorites: 0
  });

  const token = localStorage.getItem('sphere_token');

  useEffect(() => {
    fetchDocs();
    fetchStats();
  }, []);

  // 🔍 Backend search (debounced)
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchDocs(search);
    }, 400);

    return () => clearTimeout(delay);
  }, [search]);

  const fetchDocs = async (searchQuery = "") => {
    try {
      setLoading(true);

      const res = await fetch(
        `/projects/smartsphere/api/dochub?search=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      setDocs(data);

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

  // ⭐ TOGGLE FAVORITE
  const toggleFavorite = async (id) => {
    await fetch(`/projects/smartsphere/api/dochub/${id}/favorite`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    fetchDocs(search);
    fetchStats();
  };

  // 📂 DRAG & DROP
  const handleDrop = async (e) => {
    e.preventDefault();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    await fetch('/projects/smartsphere/api/ai/upload', {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    fetchDocs();
    fetchStats();
  };

  return (
    <div
      className="min-h-screen p-8 text-white"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{
        background: "radial-gradient(circle at top, #0f172a, #020617)"
      }}
    >

      {/* 🔥 HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold">SmartSphere</h1>
          <p className="text-gray-400 text-sm">
            AI Cloud Intelligence Platform
          </p>
        </div>

        <button
          onClick={() => navigate('/dochub')}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl"
        >
          <Plus size={16} />
          New Doc
        </button>
      </div>

      {/* 🔍 SEARCH */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 p-3 rounded-xl bg-white/5 border border-white/10"
        />
      </div>

      {/* 📊 STATS */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Documents" value={stats.docs} icon={<FileText />} />
        <StatCard title="Favorites" value={stats.favorites} icon={<Star />} />
        <StatCard title="AI Chats" value={stats.chats} icon={<Bot />} />
        <StatCard title="Storage" value={stats.storage} icon={<Cloud />} />
      </div>

      {/* ⚡ ACTIONS */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <ActionCard
          icon={<Cloud />}
          title="CloudHub"
          desc="Import from Drive"
          onClick={() => navigate('/cloudhub')}
        />

        <ActionCard
          icon={<Bot />}
          title="BuddyBot"
          desc="Chat with documents"
          onClick={() => navigate('/buddybot')}
        />

        <ActionCard
          icon={<Upload />}
          title="Upload"
          desc="Drag & drop files"
        />
      </div>

      {/* 📁 DOCUMENTS */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

        <h2 className="text-lg font-semibold mb-4">Documents</h2>

        {loading ? (
          <Loader2 className="animate-spin mx-auto" />
        ) : docs.length === 0 ? (
          <p className="text-gray-400 text-center">No documents found</p>
        ) : (
          <div className="space-y-3">
            {docs.map(doc => (
              <div
                key={doc._id}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition group"
              >

                {/* TOP ROW */}
                <div className="flex justify-between items-center">
                  <p
                    onClick={() =>
                      navigate('/dochub', { state: { docId: doc._id } })
                    }
                    className="font-medium cursor-pointer"
                  >
                    {doc.filename}
                  </p>

                  {/* ⭐ Favorite */}
                  <Star
                    size={18}
                    onClick={() => toggleFavorite(doc._id)}
                    className={`cursor-pointer ${
                      doc.isFavorite ? "text-yellow-400" : "text-gray-500"
                    }`}
                  />
                </div>

                {/* SUMMARY */}
                <p className="text-sm text-gray-400 mt-1">
                  {doc.summary || "No summary"}
                </p>

                {/* 🧠 TAGS */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {doc.tags?.map(tag => (
                    <span
                      key={tag}
                      className="text-xs bg-white/10 px-2 py-1 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

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
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex justify-between">
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <h2 className="text-xl font-semibold">{value}</h2>
      </div>
      {icon}
    </div>
  );
}


// 🔹 ACTION CARD
function ActionCard({ icon, title, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
    >
      <div className="mb-3">{icon}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
}