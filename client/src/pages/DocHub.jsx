import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Trash2, Plus, Search, Cloud } from "lucide-react";

const DocHub = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [view, setView] = useState("home");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/projects/smartsphere/api/dochub", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        }
      });
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source) => {
    if (source === "google_drive") return "🟢";
    if (source === "onedrive") return "🔵";
    return "💻";
  };

  const createFile = async () => {
    const name = prompt("File name");
    if (!name) return;

    try {
      const res = await fetch("/projects/smartsphere/api/dochub/file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        },
        body: JSON.stringify({ filename: name, content: "" })
      });
      
      const newFile = await res.json();
      navigate('/editor', { state: { docId: newFile._id } });
    } catch (err) {
      console.error("Failed to create file", err);
      fetchItems();
    }
  };

  const openFile = (file) => {
    // REMOVED REDIRECT: Everything now opens inside the DocEditor.
    navigate('/editor', { state: { docId: file._id } });
  };

  const downloadFile = (file) => {
    const blob = new Blob([file.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    a.click();
  };

  const filteredItems = items.filter(f =>
    f.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (view === "files") {
    return (
      <div className="p-6 bg-[#0b0f19] text-white min-h-screen">
        <button onClick={() => setView("home")} className="mb-4 text-blue-400 hover:text-blue-300">
          ← Back
        </button>

        <h2 className="text-xl mb-4 font-semibold">All Files</h2>

        <input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 p-3 w-full bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
        />

        {loading ? (
          <p className="text-gray-400">Loading documents...</p>
        ) : (
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <p className="text-gray-400">No files found.</p>
            ) : (
              filteredItems.map(file => (
                <div
                  key={file._id}
                  className="p-4 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center hover:bg-white/10 transition-colors"
                >
                  <div>
                    <p className="font-medium">{file.filename}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getSourceIcon(file.source)} <span className="uppercase">{file.source.replace('_', ' ')}</span> • {file.size || 0} Bytes
                    </p>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <button onClick={() => openFile(file)} className="text-blue-400 hover:text-blue-300">Open in Editor</button>
                    <button onClick={() => downloadFile(file)} className="text-gray-400 hover:text-white">Download</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#0b0f19] text-white min-h-screen">
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl mb-8 max-w-xl">
        <Search size={18} className="text-gray-400" />
        <input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full text-white placeholder-gray-400"
        />
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div onClick={createFile} className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl cursor-pointer hover:-translate-y-1 transition-transform shadow-lg shadow-blue-900/20">
          <Plus size={24} />
          <h3 className="mt-3 font-semibold text-lg">New Document</h3>
          <p className="text-sm text-blue-200 mt-1">Create a blank file</p>
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
          <Star size={24} className="text-yellow-400" />
          <h3 className="mt-3 font-semibold text-lg">Favorites</h3>
          <p className="text-sm text-gray-400 mt-1">Starred files</p>
        </div>

        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
          <Trash2 size={24} className="text-red-400" />
          <h3 className="mt-3 font-semibold text-lg">Trash</h3>
          <p className="text-sm text-gray-400 mt-1">Deleted files</p>
        </div>

        <div onClick={() => setView("files")} className="p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
          <Cloud size={24} className="text-blue-400" />
          <h3 className="mt-3 font-semibold text-lg">All Files</h3>
          <p className="text-sm text-gray-400 mt-1">Browse your storage</p>
        </div>
      </div>
    </div>
  );
};

export default DocHub;