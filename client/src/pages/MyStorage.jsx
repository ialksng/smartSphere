import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, HardDrive, Upload, FileText, 
  Folder as FolderIcon, FolderPlus, FilePlus, ChevronRight,
  MoreVertical, Cloud, CloudDownload, Download, Edit2, Trash2, CloudUpload
} from "lucide-react";

export default function MyStorage() {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [used, setUsed] = useState(0);

  // UI States
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [exportMenuId, setExportMenuId] = useState(null); // Tracks which file's export menu is open
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, file: null });
  
  const uploadMenuRef = useRef(null);

  useEffect(() => {
    fetchData();
    
    // Close context and dropdown menus when clicking elsewhere
    const handleClickOutside = (e) => {
      setContextMenu({ visible: false, x: 0, y: 0, file: null });
      setExportMenuId(null);
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target)) {
        setShowUploadMenu(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('sphere_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const resFiles = await fetch('/projects/smartsphere/api/dochub', { headers });
      const dataFiles = await resFiles.json();
      setFiles(dataFiles || []);
      setUsed((dataFiles || []).reduce((acc, f) => acc + (f.size || 0), 0));

      const resFolders = await fetch('/projects/smartsphere/api/folders', { headers });
      const dataFolders = await resFolders.json();
      setFolders(dataFolders || []);
    } catch (error) {
      console.error("Error fetching storage data:", error);
    }
  };

  const handleCreateFolder = async () => {
    const name = prompt("Enter folder name:");
    if (!name) return;

    await fetch('/projects/smartsphere/api/folders', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ name, parent: currentFolder })
    });
    fetchData();
  };

  const handleCreateFile = async () => {
    const name = prompt("Enter file name (e.g., document.txt):");
    if (!name) return;

    const formData = new FormData();
    // FIX: Append folderId BEFORE the file so backend parsers (like multer) catch it in time
    if (currentFolder) formData.append("folderId", currentFolder);
    
    const emptyBlob = new Blob([""], { type: "text/plain" });
    formData.append("file", emptyBlob, name);

    await fetch('/projects/smartsphere/api/dochub/upload', {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` },
      body: formData
    });
    fetchData();
  };

  const handleUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles.length) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const formData = new FormData();
      // FIX: Append folderId FIRST
      if (currentFolder) formData.append("folderId", currentFolder);
      formData.append("file", selectedFiles[i]);

      await fetch('/projects/smartsphere/api/dochub/upload', {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` },
        body: formData
      });
    }
    fetchData();
    setShowUploadMenu(false);
  };

  // --- CLOUD PULL/PUSH FUNCTIONS ---
  
  const pullFromCloud = async (provider) => {
    // Note: Update this endpoint to match your actual CloudHub import route
    alert(`Initiating import from ${provider} to local storage...`);
    await fetch('/projects/smartsphere/api/cloud/import', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ provider, folderId: currentFolder })
    });
    fetchData();
    setShowUploadMenu(false);
  };

  const pushToCloud = async (itemId, type, provider) => {
    // Note: Update this endpoint to match your actual CloudHub export route
    alert(`Exporting ${type} to ${provider}...`);
    await fetch(`/projects/smartsphere/api/cloud/${provider}/upload-local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ itemId, type }) 
    });
    setExportMenuId(null);
  };

  // --- CONTEXT MENU FUNCTIONS (Right Click) ---

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, file });
  };

  const handleRename = async () => {
    if (!contextMenu.file) return;
    const newName = prompt("Enter new name:", contextMenu.file.name || contextMenu.file.filename);
    if (!newName) return;

    await fetch(`/projects/smartsphere/api/dochub/${contextMenu.file._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ name: newName })
    });
    fetchData();
  };

  const handleDownload = () => {
    if (!contextMenu.file) return;
    // Assumes backend serves the file at a specific URL, update if different
    window.open(`/projects/smartsphere/api/dochub/download/${contextMenu.file._id}`, "_blank");
  };

  const handleDelete = async () => {
    if (!contextMenu.file) return;
    if (!window.confirm("Move to Trash?")) return;

    // Assuming you have a trash route, otherwise change to DELETE method
    await fetch(`/projects/smartsphere/api/dochub/${contextMenu.file._id}/trash`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` }
    });
    fetchData();
  };

  // --- NAVIGATION ---

  const openFolder = (folder) => {
    setCurrentFolder(folder._id);
    setFolderPath([...folderPath, { _id: folder._id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index) => {
    if (index === -1) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setCurrentFolder(newPath[newPath.length - 1]._id);
      setFolderPath(newPath);
    }
  };

  // FIX: Open in doceditor instead of dochub
  const openFile = (file) => {
    navigate('/doceditor', { state: { fileId: file._id } });
  };

  const currentFolders = folders.filter(f => f.parent === currentFolder);
  const currentFiles = files.filter(f => (f.folderId || null) === currentFolder);
  const percent = Math.min((used / (500 * 1024 * 1024)) * 100, 100);

  return (
    <div className="p-8 text-white bg-[#0b0f19] min-h-full relative">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-2 rounded hover:bg-white/10">
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
        <div className="w-full bg-white/10 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-wrap gap-4 mb-6 relative">
        <button onClick={handleCreateFolder} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded flex items-center gap-2 transition">
          <FolderPlus size={16} /> New Folder
        </button>
        <button onClick={handleCreateFile} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded flex items-center gap-2 transition">
          <FilePlus size={16} /> New File
        </button>

        {/* Unified Upload Button */}
        <div className="relative" ref={uploadMenuRef}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowUploadMenu(!showUploadMenu); }} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2 transition"
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
              <label className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 cursor-pointer text-sm">
                <FolderIcon size={16} className="text-yellow-400"/> Folder
                <input type="file" webkitdirectory="true" directory="true" hidden onChange={handleUpload} />
              </label>
              
              <div className="border-t border-white/10 my-1"></div>
              
              <div className="p-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Import from CloudHub</div>
              <button onClick={() => pullFromCloud('google')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-left">
                <CloudDownload size={16} className="text-green-400"/> Google Drive
              </button>
              <button onClick={() => pullFromCloud('onedrive')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-left">
                <CloudDownload size={16} className="text-blue-400"/> OneDrive
              </button>
              <button onClick={() => pullFromCloud('dropbox')} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-sm text-left">
                <CloudDownload size={16} className="text-blue-600"/> Dropbox
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BREADCRUMBS */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <button onClick={() => navigateToBreadcrumb(-1)} className="hover:text-white transition">Root</button>
        {folderPath.map((folder, index) => (
          <div key={folder._id} className="flex items-center gap-2">
            <ChevronRight size={14} />
            <button 
              onClick={() => navigateToBreadcrumb(index)}
              className={`${index === folderPath.length - 1 ? "text-white font-medium" : "hover:text-white transition"}`}
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-4 gap-4">
        
        {/* Render Folders */}
        {currentFolders.map(folder => (
          <div key={folder._id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col justify-between relative">
            <div onClick={() => openFolder(folder)} className="cursor-pointer">
              <FolderIcon className="text-yellow-400 mb-2" size={24} fill="currentColor" />
              <p className="text-sm font-medium truncate">{folder.name}</p>
            </div>
            
            {/* Folder Export Dropdown Toggle */}
            <button onClick={(e) => { e.stopPropagation(); setExportMenuId(exportMenuId === folder._id ? null : folder._id); }} className="mt-3 text-xs text-green-400 text-left hover:text-green-300 transition flex items-center gap-1">
              <CloudUpload size={14} /> Export to Cloud
            </button>
            
            {/* Folder Export Menu */}
            {exportMenuId === folder._id && (
              <div className="absolute bottom-10 left-4 bg-[#1a2235] border border-white/10 rounded shadow-lg z-10 w-40 overflow-hidden">
                <button onClick={() => pushToCloud(folder._id, 'folder', 'google')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Google Drive</button>
                <button onClick={() => pushToCloud(folder._id, 'folder', 'onedrive')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">OneDrive</button>
                <button onClick={() => pushToCloud(folder._id, 'folder', 'dropbox')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Dropbox</button>
              </div>
            )}
          </div>
        ))}

        {/* Render Files */}
        {currentFiles.map(file => (
          <div 
            key={file._id} 
            onContextMenu={(e) => handleContextMenu(e, file)}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col justify-between relative"
          >
            <div onClick={() => openFile(file)} className="cursor-pointer">
              <FileText className="text-blue-400 mb-2" size={24} />
              <p className="text-sm truncate">{file.name || file.filename}</p>
            </div>

             {/* File Export Dropdown Toggle */}
             <button onClick={(e) => { e.stopPropagation(); setExportMenuId(exportMenuId === file._id ? null : file._id); }} className="mt-3 text-xs text-green-400 text-left hover:text-green-300 transition flex items-center gap-1">
              <CloudUpload size={14} /> Export to Cloud
            </button>

            {/* File Export Menu */}
            {exportMenuId === file._id && (
              <div className="absolute bottom-10 left-4 bg-[#1a2235] border border-white/10 rounded shadow-lg z-10 w-40 overflow-hidden">
                <button onClick={() => pushToCloud(file._id, 'file', 'google')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Google Drive</button>
                <button onClick={() => pushToCloud(file._id, 'file', 'onedrive')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">OneDrive</button>
                <button onClick={() => pushToCloud(file._id, 'file', 'dropbox')} className="w-full text-left px-3 py-2 text-xs hover:bg-white/5">Dropbox</button>
              </div>
            )}
          </div>
        ))}

        {currentFolders.length === 0 && currentFiles.length === 0 && (
          <div className="col-span-4 text-center text-gray-500 py-8">
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
            {contextMenu.file.name || contextMenu.file.filename}
          </div>
          <button onClick={() => { handleRename(); setContextMenu({visible: false}); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition">
            <Edit2 size={16} className="text-yellow-400"/> Rename
          </button>
          <button onClick={() => { handleDownload(); setContextMenu({visible: false}); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left transition">
            <Download size={16} className="text-blue-400"/> Download
          </button>
          <button onClick={() => { handleDelete(); setContextMenu({visible: false}); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/20 text-red-400 text-left transition">
            <Trash2 size={16} /> Move to Trash
          </button>
        </div>
      )}
    </div>
  );
}