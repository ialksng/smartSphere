import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Cloud, Bot, Loader2
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
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-gray-400 text-sm">
          Your AI-powered cloud workspace
        </p>
      </div>

      {/* 🔥 QUICK ACTIONS */}
      <div className="grid md:grid-cols-3 gap-6">

        <ActionCard
          icon={<Cloud />}
          title="Import from Cloud"
          desc="Connect and import files"
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
        <h2 className="text-lg font-semibold mb-4">Recent Documents</h2>

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
                onClick={() => navigate('/dochub', { state: { docId: doc._id } })}
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10"
              >
                <p className="font-medium">{doc.filename}</p>
                <p className="text-sm text-gray-400">
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

// COMPONENTS

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