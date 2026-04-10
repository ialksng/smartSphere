import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, HardDrive, Upload, FileText, 
  Folder as FolderIcon, FolderPlus, FilePlus, ChevronRight 
} from "lucide-react";

export default function MyStorage() {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null); // null means root
  const [folderPath, setFolderPath] = useState([]); // Array to track breadcrumbs
  const [used, setUsed] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('sphere_token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch Files
      const resFiles = await fetch('/projects/smartsphere/api/dochub', { headers });
      const dataFiles = await resFiles.json();
      setFiles(dataFiles || []);

      const total = (dataFiles || []).reduce((acc, f) => acc + (f.size || 0), 0);
      setUsed(total);

      // Fetch Folders
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

    // Create an empty file blob to upload
    const formData = new FormData();
    const emptyBlob = new Blob([""], { type: "text/plain" });
    formData.append("file", emptyBlob, name);
    if (currentFolder) formData.append("folderId", currentFolder);

    await fetch('/projects/smartsphere/api/dochub/upload', {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: formData
    });
    fetchData();
  };

  // Handles both single/multiple file uploads and folder uploads
  const handleUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles.length) return;

    for (let i = 0; i < selectedFiles.length; i++) {
      const formData = new FormData();
      formData.append("file", selectedFiles[i]);
      if (currentFolder) formData.append("folderId", currentFolder);
      
      // If preserving relative paths for nested folder uploads is supported by your backend:
      // formData.append("path", selectedFiles[i].webkitRelativePath);

      await fetch('/projects/smartsphere/api/dochub/upload', {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        },
        body: formData
      });
    }
    fetchData();
  };

  const uploadItemToDrive = async (itemId, type = 'file') => {
    await fetch('/projects/smartsphere/api/cloud/google/upload-local', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      // Using itemId and type allows backend to handle folder-to-drive recursively
      body: JSON.stringify({ itemId, type }) 
    });

    alert(`Uploaded ${type} to Google Drive`);
  };

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

  const openFile = (file) => {
    navigate('/dochub', { state: { fileId: file._id } });
  };

  // Filter current view
  const currentFolders = folders.filter(f => f.parent === currentFolder);
  // Files need a folderId in backend schema. If missing, assumes root.
  const currentFiles = files.filter(f => (f.folderId || null) === currentFolder);

  const percent = Math.min((used / (500 * 1024 * 1024)) * 100, 100);

  return (
    <div className="p-8 text-white bg-[#0b0f19] min-h-full">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <HardDrive className="text-blue-400" />
          My Storage
        </h1>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>{(used / (1024 * 1024)).toFixed(1)} MB used</span>
          <span>500 MB</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={handleCreateFolder} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded flex items-center gap-2 transition">
          <FolderPlus size={16} /> New Folder
        </button>
        <button onClick={handleCreateFile} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded flex items-center gap-2 transition">
          <FilePlus size={16} /> New File
        </button>

        <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer flex items-center gap-2 transition">
          <Upload size={16} /> Upload Files
          <input type="file" multiple hidden onChange={handleUpload} />
        </label>
        
        {/* Upload Folder (webkitdirectory) */}
        <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded cursor-pointer flex items-center gap-2 transition">
          <Upload size={16} /> Upload Local Folder
          <input type="file" webkitdirectory="true" directory="true" hidden onChange={handleUpload} />
        </label>
      </div>

      {/* Breadcrumbs */}
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

      <div className="grid md:grid-cols-4 gap-4">
        {/* Render Folders */}
        {currentFolders.map(folder => (
          <div key={folder._id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col justify-between">
            <div onClick={() => openFolder(folder)} className="cursor-pointer">
              <FolderIcon className="text-yellow-400 mb-2" size={24} fill="currentColor" />
              <p className="text-sm font-medium truncate">{folder.name}</p>
            </div>
            <button
              onClick={() => uploadItemToDrive(folder._id, 'folder')}
              className="mt-3 text-xs text-green-400 text-left hover:text-green-300 transition"
            >
              Upload to Drive
            </button>
          </div>
        ))}

        {/* Render Files */}
        {currentFiles.map(file => (
          <div key={file._id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition flex flex-col justify-between">
            <div onClick={() => openFile(file)} className="cursor-pointer">
              <FileText className="text-blue-400 mb-2" size={24} />
              <p className="text-sm truncate">{file.name || file.filename}</p>
            </div>
            <button
              onClick={() => uploadItemToDrive(file._id, 'file')}
              className="mt-3 text-xs text-green-400 text-left hover:text-green-300 transition"
            >
              Upload to Drive
            </button>
          </div>
        ))}

        {currentFolders.length === 0 && currentFiles.length === 0 && (
          <div className="col-span-4 text-center text-gray-500 py-8">
            This folder is empty.
          </div>
        )}
      </div>
    </div>
  );
}