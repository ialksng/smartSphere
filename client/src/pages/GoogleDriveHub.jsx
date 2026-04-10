import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud, FileText, Loader2,
  Search, Folder, ChevronRight,
  ExternalLink, DownloadCloud, Bot, AlertCircle
} from 'lucide-react';

export default function GoogleDriveHub() {
  const navigate = useNavigate();

  const [driveFiles, setDriveFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importingFileId, setImportingFileId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null); 

  const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'My Drive' });
  const [folderHistory, setFolderHistory] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchDriveData('root');
  }, []);

  const fetchDriveData = async (folderId, search = '') => {
    setIsLoading(true);
    setErrorMessage(null); // Reset errors on new fetch

    try {
      const url = search
        ? `/projects/smartsphere/api/cloud/google/files?search=${search}`
        : `/projects/smartsphere/api/cloud/google/files?folderId=${folderId}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        }
      });

      const data = await res.json();

      if (res.ok) {
        // Ensure we always set an array to prevent .filter crashes
        setDriveFiles(Array.isArray(data) ? data : []);
      } else {
        setDriveFiles([]);
        setErrorMessage(data.message || "Failed to load Google Drive");
      }

    } catch (err) {
      console.error(err);
      setDriveFiles([]);
      setErrorMessage("Network error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (id, name) => {
    setFolderHistory(prev => [...prev, currentFolder]);
    setCurrentFolder({ id, name });
    fetchDriveData(id);
  };

  const handleBreadcrumbClick = (index) => {
    const newHistory = folderHistory.slice(0, index);
    const folder = folderHistory[index];

    setFolderHistory(newHistory);
    setCurrentFolder(folder);
    fetchDriveData(folder.id);
  };

  const handleImportFile = async (fileId, fileName, mimeType, target) => {
    try {
      setImportingFileId(fileId);

      const res = await fetch('/projects/smartsphere/api/cloud/google/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        },
        body: JSON.stringify({ fileId, fileName, mimeType })
      });

      const data = await res.json();

      if (res.ok) {
        if (target === 'dochub') {
          navigate('/dochub', { state: { docId: data.insight._id } });
        }
        if (target === 'buddybot') {
          navigate('/buddybot', { state: { docId: data.insight._id } });
        }
      } else {
        alert(`Import failed: ${data.message}`);
      }

    } catch (err) {
      console.error(err);
      alert("Import failed. Please check connection.");
    } finally {
      setImportingFileId(null);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const token = localStorage.getItem('sphere_token');
      if (!token) return alert("Please log in first.");

      // Decode the JWT to get the user ID required by your backend route
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id || payload._id;

      const res = await fetch(`/projects/smartsphere/api/cloud/google/auth?userId=${userId}`);
      const data = await res.json();

      if (data.url) {
        // Redirect to the Google Consent Screen
        window.location.href = data.url; 
      } else {
        alert("Failed to get authentication URL.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      alert("Error connecting to Google.");
    }
  };

  // SAFELY filter items only if driveFiles is an array
  const safeDriveFiles = Array.isArray(driveFiles) ? driveFiles : [];
  const folders = safeDriveFiles.filter(f => f.mimeType?.includes('folder'));
  const files = safeDriveFiles.filter(f => !f.mimeType?.includes('folder'));

  return (
    <div className="p-8">

      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Cloud className="text-blue-400" />
          Google Drive
        </h1>
        <p className="text-gray-400 text-sm">
          Import files into DocHub or chat with them in BuddyBot
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent outline-none w-full text-sm text-white"
          />
        </div>

        <button
          onClick={() => {
            if (!searchTerm.trim()) return;
            setIsSearching(true);
            fetchDriveData(null, searchTerm);
          }}
          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 transition rounded-xl text-sm"
        >
          Search
        </button>

        {isSearching && (
          <button
            onClick={() => {
              setIsSearching(false);
              setSearchTerm('');
              setFolderHistory([]);
              setCurrentFolder({ id: 'root', name: 'My Drive' });
              fetchDriveData('root');
            }}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 transition rounded-xl text-sm"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <button
          className="hover:text-white transition"
          onClick={() => {
            setCurrentFolder({ id: 'root', name: 'My Drive' });
            setFolderHistory([]);
            fetchDriveData('root');
          }}
        >
          My Drive
        </button>

        {folderHistory.map((f, i) => (
          <div key={f.id} className="flex items-center gap-2">
            <ChevronRight size={14} />
            <button className="hover:text-white transition" onClick={() => handleBreadcrumbClick(i)}>
              {f.name}
            </button>
          </div>
        ))}

        <ChevronRight size={14} />
        <span className="text-white">{currentFolder.name}</span>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[300px]">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-blue-400" size={32} />
          </div>
        ) : errorMessage ? (
          
          <div className="flex flex-col items-center justify-center text-red-400 py-10">
            {/* Moved the comment safely inside the div */}
            {/* Reconnect Button UI */}
            <AlertCircle size={40} className="mb-4 opacity-80" />
            <p className="text-center mb-6">{errorMessage}</p>
            <button 
              onClick={handleConnectGoogle}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center gap-2 shadow-lg"
            >
              <Cloud size={18} /> Reconnect Google Drive
            </button>
          </div>

        ) : files.length === 0 && folders.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No files found
          </div>
        ) : (
          <>
            {folders.length > 0 && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => handleFolderClick(folder.id, folder.name)}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition"
                  >
                    <Folder className="text-emerald-400 mb-2" />
                    <p className="text-sm truncate text-white">{folder.name}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
                >
                  <div className="flex items-center gap-3 overflow-hidden pr-4">
                    <FileText className="text-blue-400 flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown Date'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {file.webViewLink && (
                      <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                        <ExternalLink size={16} />
                      </a>
                    )}

                    <button
                      onClick={() => handleImportFile(file.id, file.name, file.mimeType, 'dochub')}
                      className="text-gray-400 hover:text-blue-400 transition"
                      title="Import to DocHub"
                    >
                      {importingFileId === file.id
                        ? <Loader2 className="animate-spin" size={16} />
                        : <DownloadCloud size={16} />}
                    </button>

                    <button
                      onClick={() => handleImportFile(file.id, file.name, file.mimeType, 'buddybot')}
                      className="text-gray-400 hover:text-emerald-400 transition"
                      title="Send to BuddyBot"
                    >
                      <Bot size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}