import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, FileText, Loader2, ArrowLeft, Search, AlertCircle, Folder, ChevronRight, ExternalLink, DownloadCloud } from 'lucide-react';

export default function GoogleDriveHub() {
    const navigate = useNavigate();

    const [driveFiles, setDriveFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [importingFileId, setImportingFileId] = useState(null);

    // Navigation
    const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'My Drive' });
    const [folderHistory, setFolderHistory] = useState([]);

    // 🔥 Search
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
                headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` }
            });

            if (res.ok) {
                const data = await res.json();
                setDriveFiles(data);
                setIsConnected(true);
            } else if (res.status === 401) {
                setIsConnected(false);
            }
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

        try {
            const res = await fetch('/projects/smartsphere/api/cloud/google/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
                },
                body: JSON.stringify({ fileId, fileName, mimeType })
            });

            if (res.ok) {
                alert(`Imported ${fileName}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setImportingFileId(null);
        }
    };

    const folders = driveFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    const files = driveFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

    return (
        <div className="min-h-screen bg-darkBg text-white p-8">
            <div className="max-w-5xl mx-auto">

                {/* HEADER */}
                <header className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate('/dashboard')}>
                        <ArrowLeft />
                    </button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Cloud /> Google Drive Explorer
                    </h1>
                </header>

                {/* 🔥 SEARCH BAR */}
                <div className="flex gap-2 mb-4">
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search Drive..."
                        className="flex-1 p-2 bg-white/10 rounded"
                    />
                    <button
                        onClick={() => {
                            setIsSearching(true);
                            fetchDriveData(null, searchTerm);
                        }}
                        className="bg-blue-600 px-4 rounded"
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
                            className="bg-gray-600 px-3 rounded"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* 🔥 BREADCRUMBS */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-gray-400">
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
                        <div key={f.id} className="flex items-center gap-1">
                            <ChevronRight size={14} />
                            <button
                                onClick={() => {
                                    const newHistory = folderHistory.slice(0, i);
                                    setFolderHistory(newHistory);
                                    setCurrentFolder(f);
                                    fetchDriveData(f.id);
                                }}
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
                {isLoading ? (
                    <Loader2 className="animate-spin" />
                ) : !isConnected ? (
                    <p>Connect Google Drive</p>
                ) : (
                    <>
                        {/* FOLDERS */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {folders.map(f => (
                                <button key={f.id} onClick={() => handleFolderClick(f.id, f.name)}>
                                    <Folder /> {f.name}
                                </button>
                            ))}
                        </div>

                        {/* FILES */}
                        <div className="space-y-2">
                            {files.map(file => (
                                <div key={file.id} className="flex justify-between bg-white/5 p-3 rounded">
                                    <span>{file.name}</span>

                                    <div className="flex gap-2">
                                        {file.webViewLink && (
                                            <a href={file.webViewLink} target="_blank" rel="noreferrer">
                                                <ExternalLink size={16} />
                                            </a>
                                        )}

                                        <button onClick={() => handleImportFile(file.id, file.name, file.mimeType)}>
                                            <DownloadCloud size={16} />
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