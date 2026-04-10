import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, FileText, Loader2, ArrowLeft, Search, AlertCircle, Folder, ChevronRight, ExternalLink, DownloadCloud } from 'lucide-react';

export default function GoogleDriveHub() {
    const navigate = useNavigate();
    const [driveFiles, setDriveFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [importingFileId, setImportingFileId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // Folder Navigation State
    const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'My Drive' });
    const [folderHistory, setFolderHistory] = useState([]);

    useEffect(() => {
        fetchDriveData('root');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDriveData = async (folderId) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/projects/smartsphere/api/cloud/google/files?folderId=${folderId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sphere_token')}` }
            });

            if (res.ok) {
                const files = await res.json();
                setDriveFiles(files);
                setIsConnected(true);
            } else if (res.status === 401) {
                setIsConnected(false); 
            }
        } catch (error) {
            console.error("Failed to fetch Google Drive files", error);
            setIsConnected(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectDrive = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('sphere_token');
            if (!token) return;
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.id;

            const authRes = await fetch(`/projects/smartsphere/api/cloud/google/auth?userId=${userId}`);
            const authData = await authRes.json();
            if (authData.url) window.location.href = authData.url;
        } catch (error) {
            console.error("Failed to initiate auth", error);
            setIsLoading(false);
        }
    };

    const handleFolderClick = (folderId, folderName) => {
        setFolderHistory([...folderHistory, currentFolder]); 
        setCurrentFolder({ id: folderId, name: folderName }); 
        fetchDriveData(folderId); 
    };

    const handleNavigateBack = () => {
        if (folderHistory.length === 0) return;
        const previousFolder = folderHistory[folderHistory.length - 1];
        const newHistory = folderHistory.slice(0, -1);
        
        setFolderHistory(newHistory);
        setCurrentFolder(previousFolder);
        fetchDriveData(previousFolder.id);
    };

    const handleImportFile = async (fileId, fileName, mimeType) => {
        setImportingFileId(fileId);
        try {
            const res = await fetch('/projects/smartsphere/api/cloud/google/import', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sphere_token')}` 
                },
                body: JSON.stringify({ fileId, fileName, mimeType })
            });

            if (res.ok) {
                alert(`Successfully imported ${fileName}! You can now ask the AI about it.`);
            } else {
                const errorData = await res.json();
                alert(errorData.message);
            }
        } catch (error) {
            console.error("Import failed", error);
            alert("Failed to import document.");
        } finally {
            setImportingFileId(null);
        }
    };

    // Separate folders and files for clean UI rendering
    const folders = driveFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    const files = driveFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

    return (
        <div className="min-h-screen w-full bg-darkBg text-white p-8 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                <header className="flex items-center justify-between mb-8 border-b border-glassBorder pb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Cloud className="text-blue-400" size={32} />
                                Google Drive Explorer
                            </h1>
                            <p className="text-gray-400 mt-1">Browse, preview, and select files to import to your AI knowledge base.</p>
                        </div>
                    </div>
                </header>

                <div className="bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl p-6 min-h-[600px] flex flex-col">
                    
                    {/* Navigation Breadcrumbs */}
                    {isConnected && !isLoading && (
                        <div className="flex items-center gap-2 mb-6 px-2 text-sm text-gray-400 bg-white/5 p-3 rounded-lg border border-glassBorder">
                            <button 
                                onClick={() => {
                                    setCurrentFolder({ id: 'root', name: 'My Drive' });
                                    setFolderHistory([]);
                                    fetchDriveData('root');
                                }}
                                className="hover:text-blue-400 transition font-medium"
                            >
                                My Drive
                            </button>
                            {folderHistory.length > 0 && (
                                <>
                                    <ChevronRight size={16} />
                                    <button onClick={handleNavigateBack} className="hover:text-blue-400 transition font-medium">...</button>
                                </>
                            )}
                            {currentFolder.id !== 'root' && (
                                <>
                                    <ChevronRight size={16} />
                                    <span className="text-blue-400 font-bold">{currentFolder.name}</span>
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-blue-400">
                                <Loader2 className="animate-spin mb-4" size={40} />
                                <p className="text-gray-400">Loading folder contents...</p>
                            </div>
                        ) : !isConnected ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                                <AlertCircle size={48} className="mb-4 text-blue-400 opacity-80" />
                                <button onClick={handleConnectDrive} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition">
                                    Connect Google Drive
                                </button>
                            </div>
                        ) : driveFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p>This folder is empty.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* FOLDERS SECTION */}
                                {folders.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Folders</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {folders.map(folder => (
                                                <button 
                                                    key={folder.id} 
                                                    onClick={() => handleFolderClick(folder.id, folder.name)}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 hover:border-blue-500/50 transition group text-left"
                                                >
                                                    <Folder size={20} className="text-emerald-400 flex-shrink-0" fill="currentColor" opacity={0.8} />
                                                    <span className="font-medium text-sm truncate">{folder.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* FILES SECTION */}
                                {files.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Files</h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            {files.map(file => (
                                                <div key={file.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 transition group">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400 flex-shrink-0">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="truncate">
                                                            <h4 className="font-medium text-white text-sm truncate pr-4">{file.name}</h4>
                                                            <p className="text-xs text-gray-500 mt-0.5">Modified: {new Date(file.modifiedTime).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                                        {/* NEW: View File Button */}
                                                        {file.webViewLink && (
                                                            <a 
                                                                href={file.webViewLink} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="px-3 py-2 text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium border border-glassBorder transition flex items-center gap-1"
                                                                title="See file in Google Drive"
                                                            >
                                                                <ExternalLink size={14} />
                                                                See File
                                                            </a>
                                                        )}

                                                        {/* Import Button */}
                                                        <button 
                                                            onClick={() => handleImportFile(file.id, file.name, file.mimeType)}
                                                            disabled={importingFileId === file.id}
                                                            className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white disabled:opacity-50 disabled:hover:bg-blue-600/20 rounded-lg text-xs font-medium border border-blue-500/30 transition flex items-center gap-1"
                                                        >
                                                            {importingFileId === file.id ? <Loader2 size={14} className="animate-spin" /> : <DownloadCloud size={14} />}
                                                            {importingFileId === file.id ? 'Importing...' : 'Import to AI'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}