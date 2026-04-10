import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, HardDrive, Upload, FileText, 
  Folder as FolderIcon, FolderPlus, FilePlus, ChevronRight,
  MoreVertical, Cloud, CloudDownload, Download, Edit2, Trash2, CloudUpload, Bot
} from "lucide-react";

export default function MyStorage() {
  const navigate = useNavigate();

  // Unified Storage State
  const [items, setItems] = useState([]); 
  const [used, setUsed] = useState(0);

  // Folder Navigation State
  const [currentFolder, setCurrentFolder] = useState({ id: null, name: 'My Storage' });
  const [folderHistory, setFolderHistory] = useState([]);

  // UI States
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [exportMenuId, setExportMenuId] = useState(null); 
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, file: null });
  
  const uploadMenuRef = useRef(null);

  useEffect(() => {
    fetchData(currentFolder.id);
    
    const handleClickOutside = (e) => {
      setContextMenu({ visible: false, x: 0, y: 0, file: null });
      setExportMenuId(null);
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target)) {
        setShowUploadMenu(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [currentFolder]);

  const fetchData = async (parentId = null) => {
    const url = parentId 
      ? `/projects/smartsphere/api/dochub?parentId=${parentId}` 
      : `/projects/smartsphere/api/dochub`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` }
      });
      const data = await res.json();
      setItems(data || []);
      
      // Dynamic Storage Fix: Only calculate total usage when viewing the root folder
      // (This prevents the storage bar from shrinking when viewing empty sub-folders)
      if (parentId === null) {
        const total = (data || []).reduce((acc, f) => acc + (f.size || 0), 0);
        setUsed(total);
      }
    } catch (error) {
      console.error("Error fetching storage data:", error);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;

    // FIX: Changed endpoint to /api/folders (plural) to match server.js
    await fetch('/projects/smartsphere/api/folders', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ name, parent: currentFolder.id })
    });
    fetchData(currentFolder.id);
  };

  const handleCreateFile = async () => {
    const name = prompt("Enter file name (e.g., document.txt):");
    if (!name) return;

    await fetch('/projects/smartsphere/api/dochub/file', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ filename: name, content: "", parentId: currentFolder.id })
    });
    fetchData(currentFolder.id);
  };

  const handleUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles.length) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const formData = new FormData();
      if (currentFolder.id) formData.append("parentId", currentFolder.id);
      formData.append("file", selectedFiles[i]);

      await fetch('/projects/smartsphere/api/dochub/upload', {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` },
        body: formData
      });
    }
    fetchData(currentFolder.id);
    setShowUploadMenu(false);
  };

  // --- CLOUD PULL/PUSH FUNCTIONS ---
  
  const pullFromCloud = async (provider) => {
    alert(`Initiating import from ${provider} to local storage... (Feature coming soon)`);
    setShowUploadMenu(false);
  };

  const pushToCloud = async (itemId, type, provider) => {
    if (provider !== 'google') {
        alert(`${provider} export coming soon!`);
        setExportMenuId(null);
        return;
    }

    // Ask user for destination folder ID
    const targetDriveFolderId = prompt("Enter Google Drive Folder ID to save to (leave blank for root):") || "root";

    try {
      const res = await fetch('/projects/smartsphere/api/cloud/google/upload-local', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        },
        body: JSON.stringify({ 
          itemId: itemId, 
          type: type,
          driveFolderId: targetDriveFolderId
        }) 
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Uploaded to Google Drive Successfully!");
      } else {
        alert(`Failed: ${data.message}`);
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
    setExportMenuId(null);
  };

  // --- BUDDYBOT IMPORT FUNCTION ---
  const sendToBuddyBot = (file) => {
    navigate('/buddybot', { state: { importedFile: file } });
  };

  // --- CONTEXT MENU FUNCTIONS (Right Click) ---

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, file });
  };

  const handleRename = async () => {
    if (!contextMenu.file) return;
    const newName = prompt("Enter new name:", contextMenu.file.filename);
    if (!newName) return;

    await fetch(`/projects/smartsphere/api/dochub/${contextMenu.file._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ name: newName }) 
    });
    fetchData(currentFolder.id);
  };

  const handleDownload = () => {
    if (!contextMenu.file) return;
    if(contextMenu.file.content) {
        const blob = new Blob([contextMenu.file.content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = contextMenu.file.filename;
        a.click();
    } else {
        alert("File content unavailable for direct download.");
    }
  };

  const handleDelete = async () => {
    if (!contextMenu.file) return;
    if (!window.confirm("Move to Trash?")) return;

    await fetch(`/projects/smartsphere/api/dochub/${contextMenu.file._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` }
    });
    fetchData(currentFolder.id);
  };

  // --- NAVIGATION ---

  const openFolder = (folder) => {
    setFolderHistory(prev => [...prev, currentFolder]);
    setCurrentFolder({ id: folder._id, name: folder.filename });
  };

  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      setCurrentFolder({ id: null, name: 'My Storage' });
      setFolderHistory([]);
    } else {
      const newHistory = folderHistory.slice(0, index);
      const folder = folderHistory[index];
      setFolderHistory(newHistory);
      setCurrentFolder(folder);
    }
  };

  const openFile = (file) => {
    // FIX: Pass docId to correctly open in DocEditor
    navigate('/doceditor', { state: { docId: file._id } });
  };

  const percent = Math.min((used / (500 * 1024 * 1024)) * 100, 100);

  return (
    <div className="p-8 text-white bg-[#0b0f19] min-h-screen relative">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded hover:bg-white/10 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <HardDrive className="text-blue-400" /> My Storage
        </h1>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>{(used / (1024 * 1024)).toFixed(1)} MB used</span>
          <span>500 MB</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-wrap gap-4 mb-6 relative">
        <button onClick={handleCreateFolder} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded flex items-center gap-2 transition shadow-lg">
          <FolderPlus size={16} /> New Folder
        </button>
        <button onClick={handleCreateFile} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded flex items-center gap-2 transition">
          <FilePlus size={16} /> New File
        </button>

        {/* Unified Upload Button */}
        <div className="relative" ref={uploadMenuRef}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowUploadMenu(!showUploadMenu); }} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2 transition shadow-lg"
          >
            <Upload size={16} /> Upload <ChevronRight size={16} className={`transform transition ${showUploadMenu ? 'rotate-90' : ''}`}/>
          </button>

          {/* Upload Dropdown Menu */}
          {showUploadMenu && (
            <div className="absolute top-full mt-2 left-0 w-56 bg-[#1a2235] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">From Device</div>
              <label className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer text-sm">
                <FileText size={16} className="text-blue-400"/> File(s)
                <input type="file" multiple hidden onChange={handleUpload} />
              </label>
              
              <div className="border-t border-white/10 my-1"></div>
              
              <div className="p-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Import from Cloud</div>
              <button onClick={() => pullFromCloud('google')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-left">
                <CloudDownload size={16} className="text-green-400"/> Google Drive
              </button>
              <button onClick={() => pullFromCloud('onedrive')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-left">
                <CloudDownload size={16} className="text-blue-400"/> OneDrive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BREADCRUMBS */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <button onClick={() => navigateToBreadcrumb(-1)} className="hover:text-white transition">Root</button>
        {folderHistory.map((folder, index) => (
          <div key={folder.id} className="flex items-center gap-2">
            <ChevronRight size={14} />
            <button 
              onClick={() => navigateToBreadcrumb(index)}
              className="hover:text-white transition"
            >
              {folder.name}
            </button>
          </div>
        ))}
        {currentFolder.id && (
          <div className="flex items-center gap-2">
            <ChevronRight size={14} />
            <span className="text-white font-medium">{currentFolder.name}</span>
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4 border-b border-white/10 pb-2">Files & Folders</h2>

      {/* GRID */}
      <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
        
        {/* Render Folders First */}
        {items.filter(f => f.type === 'folder').map(folder => (
          <div 
            key={folder._id} 
            onContextMenu={(e) => handleContextMenu(e, folder)}
            className="p-4 rounded-xl bg-white/5 border border-transparent hover:border-emerald-500/50 hover:bg-white/10 transition flex flex-col justify-between relative group"
          >
            <div onClick={() => openFolder(folder)} className="cursor-pointer">
              <FolderIcon className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" size={24} fill="currentColor" />
              <p className="text-sm font-medium truncate">{folder.filename}</p>
            </div>
            
            <button onClick={(e) => { e.stopPropagation(); setExportMenuId(exportMenuId === folder._id ? null : folder._id); }} className="mt-3 text-xs text-emerald-400 text-left hover:text-emerald-300 transition flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <CloudUpload size={14} /> Sync to Cloud
            </button>
            
            {exportMenuId === folder._id && (
              <div className="absolute bottom-10 left-4 bg-[#1a2235] border border-white/10 rounded shadow-lg z-10 w-40 overflow-hidden">
                <button onClick={() => pushToCloud(folder._id, 'folder', 'google')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Google Drive</button>
              </div>
            )}
          </div>
        ))}

        {/* Render Files */}
        {items.filter(f => f.type !== 'folder').map(file => (
          <div 
            key={file._id} 
            onContextMenu={(e) => handleContextMenu(e, file)}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition flex flex-col justify-between relative group"
          >
            <div onClick={() => openFile(file)} className="cursor-pointer">
              <FileText className="text-blue-400 mb-2" size={24} />
              <p className="text-sm font-medium truncate">{file.filename}</p>
              <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>

             {/* File Action Buttons */}
             <div className="mt-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); setExportMenuId(exportMenuId === file._id ? null : file._id); }} className="text-xs text-blue-400 text-left hover:text-blue-300 transition flex items-center gap-1">
                  <CloudUpload size={14} /> Sync to Cloud
                </button>
                <button onClick={(e) => { e.stopPropagation(); sendToBuddyBot(file); }} className="text-xs text-purple-400 text-left hover:text-purple-300 transition flex items-center gap-1">
                  <Bot size={14} /> Send to BuddyBot
                </button>
             </div>

            {/* File Export Menu */}
            {exportMenuId === file._id && (
              <div className="absolute bottom-16 left-4 bg-[#1a2235] border border-white/10 rounded shadow-lg z-10 w-40 overflow-hidden">
                <button onClick={() => pushToCloud(file._id, 'file', 'google')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Google Drive</button>
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-8">
            This folder is empty.
          </div>
        )}
      </div>

      {/* RIGHT CLICK CONTEXT MENU */}
      {contextMenu.visible && (
        <div 
          className="fixed bg-[#1a2235] border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden w-48 text-sm"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-white/10 text-gray-400 text-xs truncate">
            {contextMenu.file.filename}
          </div>
          <button onClick={() => { handleRename(); setContextMenu({visible: false}); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition">
            <Edit2 size={16} className="text-yellow-400"/> Rename
          </button>
          
          {contextMenu.file.type !== 'folder' && (
            <>
              <button onClick={() => { handleDownload(); setContextMenu({visible: false}); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition">
                <Download size={16} className="text-blue-400"/> Download
              </button>
              <button onClick={() => { sendToBuddyBot(contextMenu.file); setContextMenu({visible: false}); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition">
                <Bot size={16} className="text-purple-400"/> Ask BuddyBot
              </button>
            </>
          )}
          
          <button onClick={() => { handleDelete(); setContextMenu({visible: false}); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/20 text-red-400 text-left transition">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}