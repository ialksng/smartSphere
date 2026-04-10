import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud, FileText, Loader2,
  Search, Folder, ChevronRight,
  ExternalLink, DownloadCloud, Bot
} from 'lucide-react';

export default function GoogleDriveHub() {
  const navigate = useNavigate();

  const [driveFiles, setDriveFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (id, name) => {
    setFolderHistory([...folderHistory, currentFolder]);
    setCurrentFolder({ id, name });
    fetchDriveData(id);
  };

  // 🔥 IMPORT HANDLER (DOCHUB + BUDDYBOT)
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

      if (target === 'dochub') {
        navigate('/dochub', { state: { docId: data.insight._id } });
      }

      if (target === 'buddybot') {
        navigate('/buddybot', { state: { docId: data.insight._id } });
      }

    } catch (err) {
      console.error(err);
      alert("Import failed");
    } finally {
      setImportingFileId(null);
    }
  };

  const folders = driveFiles.filter(f => f.mimeType.includes('folder'));
  const files = driveFiles.filter(f => !f.mimeType.includes('folder'));

  return (
    <div className="p-8">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Cloud className="text-blue-400" />
          Google Drive
        </h1>
        <p className="text-gray-400 text-sm">
          Import files into DocHub or chat with them in BuddyBot
        </p>
      </div>

      {/* SEARCH */}
      <div className="mb-6 flex gap-3">
        <div className="flex items-center w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <Search size={16} className="text-gray-400 mr-2" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>

        <button
          onClick={() => {
            if (!searchTerm.trim()) return;
            setIsSearching(true);
            fetchDriveData(null, searchTerm);
          }}
          className="px-4 py-3 bg-blue-600 rounded-xl text-sm"
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
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-400">
        <button
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
            <button onClick={() => handleFolderClick(f.id, f.name)}>
              {f.name}
            </button>
          </div>
        ))}
      </div>

      {/* CONTENT */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-blue-400" size={32} />
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No files found
          </div>
        ) : (
          <>
            {/* FOLDERS */}
            {folders.length > 0 && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => handleFolderClick(folder.id, folder.name)}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
                  >
                    <Folder className="text-emerald-400 mb-2" />
                    <p className="text-sm truncate">{folder.name}</p>
                  </div>
                ))}
              </div>
            )}

            {/* FILES */}
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

                  {/* 🔥 ACTIONS */}
                  <div className="flex items-center gap-4">

                    {/* Open in Drive */}
                    {file.webViewLink && (
                      <a href={file.webViewLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={16} />
                      </a>
                    )}

                    {/* Import to DocHub */}
                    <button
                      onClick={() => handleImportFile(file.id, file.name, file.mimeType, 'dochub')}
                      title="Import to DocHub"
                      className="hover:text-blue-400"
                    >
                      {importingFileId === file.id
                        ? <Loader2 className="animate-spin" size={16} />
                        : <DownloadCloud size={16} />}
                    </button>

                    {/* 🔥 Send to BuddyBot */}
                    <button
                      onClick={() => handleImportFile(file.id, file.name, file.mimeType, 'buddybot')}
                      title="Chat in BuddyBot"
                      className="hover:text-emerald-400"
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