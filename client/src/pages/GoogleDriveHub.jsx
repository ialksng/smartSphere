import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud, FileText, Loader2, ArrowLeft,
  Search, Folder, ChevronRight,
  ExternalLink, DownloadCloud
} from 'lucide-react';

export default function GoogleDriveHub() {
  const navigate = useNavigate();

  const [driveFiles, setDriveFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [importingFileId, setImportingFileId] = useState(null);

  const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'My Drive' });
  const [folderHistory, setFolderHistory] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchDriveData('root');
  }, []);

  const fetchDriveData = async (folderId, search = '') => {
    setIsLoading(true);

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
      setDriveFiles(data);
      setIsConnected(true);

    } catch (err) {
      console.error(err);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (id, name) => {
    setFolderHistory([...folderHistory, currentFolder]);
    setCurrentFolder({ id, name });
    fetchDriveData(id);
  };

  const handleImportFile = async (fileId, fileName, mimeType) => {
    setImportingFileId(fileId);

    await fetch('/projects/smartsphere/api/cloud/google/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ fileId, fileName, mimeType })
    });

    setImportingFileId(null);
  };

  const folders = driveFiles.filter(f => f.mimeType.includes('folder'));
  const files = driveFiles.filter(f => !f.mimeType.includes('folder'));

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-white p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft />
            </button>

            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Cloud className="text-blue-400" />
                Google Drive
              </h1>
              <p className="text-gray-400 text-sm">
                Browse and import files into your AI workspace
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-6 flex gap-3">
          <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Search size={18} className="text-gray-400 mr-3" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search files in Drive..."
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>

          <button
            onClick={() => {
              setIsSearching(true);
              fetchDriveData(null, searchTerm);
            }}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium"
          >
            Search
          </button>

          {isSearching && (
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchTerm('');
                fetchDriveData(currentFolder.id);
              }}
              className="px-4 py-3 bg-white/10 rounded-xl text-sm"
            >
              Clear
            </button>
          )}
        </div>

        {/* BREADCRUMBS */}
        <div className="flex flex-wrap items-center gap-2 mb-6 text-sm text-gray-400">
          <button
            onClick={() => {
              setCurrentFolder({ id: 'root', name: 'My Drive' });
              setFolderHistory([]);
              fetchDriveData('root');
            }}
            className="hover:text-blue-400"
          >
            My Drive
          </button>

          {folderHistory.map((f, i) => (
            <div key={f.id} className="flex items-center gap-2">
              <ChevronRight size={14} />
              <button
                onClick={() => {
                  const newHistory = folderHistory.slice(0, i);
                  setFolderHistory(newHistory);
                  setCurrentFolder(f);
                  fetchDriveData(f.id);
                }}
                className="hover:text-blue-400"
              >
                {f.name}
              </button>
            </div>
          ))}

          {currentFolder.id !== 'root' && (
            <>
              <ChevronRight size={14} />
              <span className="text-blue-400">{currentFolder.name}</span>
            </>
          )}
        </div>

        {/* CONTENT */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-blue-400" size={40} />
            </div>
          ) : (
            <>
              {/* FOLDERS */}
              {folders.length > 0 && (
                <>
                  <h3 className="text-xs uppercase text-gray-400 mb-3">Folders</h3>
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    {folders.map(folder => (
                      <div
                        key={folder.id}
                        onClick={() => handleFolderClick(folder.id, folder.name)}
                        className="cursor-pointer p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition"
                      >
                        <Folder className="text-emerald-400 mb-2" />
                        <p className="text-sm truncate">{folder.name}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* FILES */}
              {files.length > 0 && (
                <>
                  <h3 className="text-xs uppercase text-gray-400 mb-3">Files</h3>
                  <div className="space-y-3">
                    {files.map(file => (
                      <div
                        key={file.id}
                        className="flex justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="text-blue-400" />
                          <div>
                            <p className="text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(file.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {file.webViewLink && (
                            <a href={file.webViewLink} target="_blank">
                              <ExternalLink size={16} />
                            </a>
                          )}

                          <button
                            onClick={() => handleImportFile(file.id, file.name, file.mimeType)}
                          >
                            {importingFileId === file.id
                              ? <Loader2 className="animate-spin" size={16} />
                              : <DownloadCloud size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}