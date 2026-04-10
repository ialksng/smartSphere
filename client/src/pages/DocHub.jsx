import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Trash2, Plus, Search, Cloud, Download, RefreshCw, X } from "lucide-react";

const DocHub = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [view, setView] = useState("home"); // home, files, favorites, trash
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // New Document Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [docLocation, setDocLocation] = useState("local");
  const [cloudProvider, setCloudProvider] = useState("google");

  useEffect(() => {
    if (view !== "home") {
      fetchItems(view);
    }
  }, [view]);

  const fetchItems = async (currentView) => {
    setLoading(true);
    try {
      let url = "/projects/smartsphere/api/dochub?all=true";
      
      if (currentView === "favorites") url += "&isFavorite=true";
      if (currentView === "trash") url += "&isTrashed=true";

      const res = await fetch(url, {
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

  // ---- NEW DOCUMENT LOGIC ----
  const handleCreateDocument = async () => {
    if (!docName.trim()) {
      alert("Please provide a document name.");
      return;
    }

    setLoading(true);
    try {
      // 1. Always create the blank file locally first
      const res = await fetch("/projects/smartsphere/api/dochub/file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        },
        body: JSON.stringify({ filename: docName, content: "" })
      });
      
      const newFile = await res.json();

      // 2. If user selected CloudHub, immediately export the new file to the selected cloud
      if (docLocation === "cloud") {
        await fetch(`/projects/smartsphere/api/cloud/${cloudProvider}/upload-local`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
            },
            body: JSON.stringify({ itemId: newFile._id, type: 'file' })
        });
      }

      setIsModalOpen(false);
      setDocName("");
      navigate('/editor', { state: { docId: newFile._id } });

    } catch (err) {
      console.error("Failed to create file", err);
      alert("Failed to create document.");
    } finally {
      setLoading(false);
    }
  };

  // ---- FILE ACTIONS ----
  const openFile = (file) => {
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

  const toggleFavorite = async (file) => {
    try {
      await fetch(`/projects/smartsphere/api/dochub/${file._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        },
        body: JSON.stringify({ isFavorite: !file.isFavorite })
      });
      fetchItems(view); // Refresh list
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const toggleTrash = async (file, moveToTrash) => {
    try {
      await fetch(`/projects/smartsphere/api/dochub/${file._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        },
        body: JSON.stringify({ isTrashed: moveToTrash })
      });
      fetchItems(view); // Refresh list
    } catch (err) {
      console.error("Failed to move to trash", err);
    }
  };

  const deletePermanently = async (file) => {
    if (!window.confirm("Are you sure you want to permanently delete this file?")) return;
    try {
      await fetch(`/projects/smartsphere/api/dochub/${file._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        }
      });
      fetchItems(view); // Refresh list
    } catch (err) {
      console.error("Failed to delete file", err);
    }
  };

  const filteredItems = items.filter(f =>
    f.filename.toLowerCase().includes(search.toLowerCase())
  );

  // ---- RENDER SUB-VIEWS (Files, Favorites, Trash) ----
  if (view !== "home") {
    let title = "All Files";
    if (view === "favorites") title = "Favorites";
    if (view === "trash") title = "Trash";

    return (
      <div className="p-6 bg-[#0b0f19] text-white min-h-screen">
        <button onClick={() => setView("home")} className="mb-4 text-blue-400 hover:text-blue-300">
          ← Back to Hub
        </button>

        <h2 className="text-xl mb-4 font-semibold">{title}</h2>

        <input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-6 p-3 w-full bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
        />

        {loading ? (
          <p className="text-gray-400 animate-pulse">Loading documents...</p>
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
                    <p className="font-medium flex items-center gap-2">
                      {file.filename}
                      {file.isFavorite && <Star size={14} className="text-yellow-400" fill="currentColor" />}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getSourceIcon(file.source)} <span className="uppercase">{file.source.replace('_', ' ')}</span> • {file.size || 0} Bytes
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {/* IF IN TRASH VIEW */}
                    {view === "trash" ? (
                      <>
                        <button onClick={() => toggleTrash(file, false)} className="flex items-center gap-1 text-green-400 hover:text-green-300">
                          <RefreshCw size={16} /> Restore
                        </button>
                        <button onClick={() => deletePermanently(file)} className="flex items-center gap-1 text-red-400 hover:text-red-300">
                          <X size={16} /> Delete Forever
                        </button>
                      </>
                    ) : (
                      /* IF IN FILES/FAVORITES VIEW */
                      <>
                        <button onClick={() => toggleFavorite(file)} className="text-gray-400 hover:text-yellow-400 transition-colors" title="Toggle Favorite">
                          <Star size={18} fill={file.isFavorite ? "currentColor" : "none"} className={file.isFavorite ? "text-yellow-400" : ""} />
                        </button>
                        <button onClick={() => downloadFile(file)} className="text-gray-400 hover:text-white" title="Download">
                          <Download size={18} />
                        </button>
                        <button onClick={() => openFile(file)} className="text-blue-400 hover:text-blue-300">
                          Open Editor
                        </button>
                        <button onClick={() => toggleTrash(file, true)} className="text-gray-400 hover:text-red-400 transition-colors" title="Move to Trash">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- RENDER HOME VIEW ----
  return (
    <div className="p-8 bg-[#0b0f19] text-white min-h-screen relative">
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
        <div onClick={() => setIsModalOpen(true)} className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl cursor-pointer hover:-translate-y-1 transition-transform shadow-lg shadow-blue-900/20">
          <Plus size={24} />
          <h3 className="mt-3 font-semibold text-lg">New Document</h3>
          <p className="text-sm text-blue-200 mt-1">Create a blank file</p>
        </div>

        <div onClick={() => setView("favorites")} className="p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
          <Star size={24} className="text-yellow-400" />
          <h3 className="mt-3 font-semibold text-lg">Favorites</h3>
          <p className="text-sm text-gray-400 mt-1">Starred files</p>
        </div>

        <div onClick={() => setView("trash")} className="p-6 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
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

      {/* NEW DOCUMENT CREATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a2235] p-6 rounded-xl w-[400px] border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Create Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Document Name</label>
                <input 
                  value={docName} 
                  onChange={e => setDocName(e.target.value)} 
                  placeholder="e.g. project-notes.txt" 
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Target Storage</label>
                <select 
                  value={docLocation} 
                  onChange={e => setDocLocation(e.target.value)} 
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="local">MyStorage (Local Space)</option>
                  <option value="cloud">CloudHub (External Drives)</option>
                </select>
              </div>

              {docLocation === 'cloud' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Select Cloud Provider</label>
                  <select 
                    value={cloudProvider} 
                    onChange={e => setCloudProvider(e.target.value)} 
                    className="w-full bg-[#0b0f19] border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="google">Google Drive</option>
                    <option value="onedrive">OneDrive</option>
                    <option value="dropbox">Dropbox</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateDocument}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 rounded-lg text-sm text-white font-medium transition-colors"
              >
                {loading ? "Creating..." : "Create & Open"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DocHub;