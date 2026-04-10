import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, FileText, Loader2, ArrowLeft, Search, AlertCircle, Folder, ChevronRight } from 'lucide-react';

export default function GoogleDriveHub() {
    const navigate = useNavigate();
    const [driveFiles, setDriveFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [importingFileId, setImportingFileId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // NEW: Folder Navigation State
    const [currentFolder, setCurrentFolder] = useState({ id: 'root', name: 'My Drive' });
    const [folderHistory, setFolderHistory] = useState([]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const cloudStatus = urlParams.get('cloud');
        const errorMsg = urlParams.get('msg');

        if (cloudStatus) {
            if (cloudStatus === 'success') {
                alert('Successfully connected to Google Drive!');
            } else if (cloudStatus === 'error') {
                alert(`Failed to connect.\n\nReason: ${errorMsg || 'Check server logs.'}`);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Fetch initial root files
        fetchDriveData('root');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // NEW: Accepts a folderId parameter
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

    // NEW: Handle clicking a folder
    const handleFolderClick = (folderId, folderName) => {
        setFolderHistory([...folderHistory, currentFolder]); // Push current to history
        setCurrentFolder({ id: folderId, name: folderName }); // Set new current
        fetchDriveData(folderId); // Fetch contents
    };

    // NEW: Handle going back up a directory
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
                alert(`Successfully imported ${fileName}!`);
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

    return (
        <div className="min-h-screen w-full bg-darkBg text-white p-8 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                <header className="flex items-center justify-between mb-8 border-b border-glassBorder pb-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Cloud className="text-blue-400" size={32} />
                                Google Drive
                            </h1>
                            <p className="text-gray-400 mt-1">Manage and import your cloud documents to SmartSphere AI.</p>
                        </div>
                    </div>
                </header>

                <div className="bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl p-6 min-h-[500px] flex flex-col">
                    
                    {/* NEW: Navigation Breadcrumbs */}
                    {isConnected && !isLoading && (
                        <div className="flex items-center gap-2 mb-6 px-2 text-sm text-gray-400">
                            <button 
                                onClick={() => {
                                    setCurrentFolder({ id: 'root', name: 'My Drive' });
                                    setFolderHistory([]);
                                    fetchDriveData('root');
                                }}
                                className="hover:text-white transition font-medium"
                            >
                                My Drive
                            </button>
                            {folderHistory.length > 0 && (
                                <>
                                    <ChevronRight size={16} />
                                    <button onClick={handleNavigateBack} className="hover:text-white transition">...</button>
                                </>
                            )}
                            {currentFolder.id !== 'root' && (
                                <>
                                    <ChevronRight size={16} />
                                    <span className="text-blue-400 font-medium">{currentFolder.name}</span>
                                </>
                            )}
                        </div>
                    )}

                    {/* File List Area */}
                    <div className="flex-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-blue-400">
                                <Loader2 className="animate-spin mb-4" size={40} />
                                <p className="text-gray-400">Fetching files...</p>
                            </div>
                        ) : !isConnected ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                                <AlertCircle size={48} className="mb-4 text-blue-400 opacity-80" />
                                <p className="mb-6 text-center max-w-md">Your Google Drive is not connected. Connect your account to import files and analyze them with AI.</p>
                                <button 
                                    onClick={handleConnectDrive}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition"
                                >
                                    Connect Google Drive
                                </button>
                            </div>
                        ) : driveFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p>This folder is empty or has no supported files.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {driveFiles.map((file) => {
                                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

                                    return (
                                        <div key={file.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 transition group">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className={`p-3 rounded-lg flex-shrink-0 ${isFolder ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {isFolder ? <Folder size={24} fill="currentColor" className="opacity-80" /> : <FileText size={24} />}
                                                </div>
                                                <div className="truncate">
                                                    <h4 className="font-medium text-white truncate pr-4">{file.name}</h4>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {isFolder ? 'Folder' : `Modified: ${new Date(file.modifiedTime).toLocaleDateString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {/* Logic to either open folder or import file */}
                                            {isFolder ? (
                                                <button 
                                                    onClick={() => handleFolderClick(file.id, file.name)}
                                                    className="flex-shrink-0 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-sm font-medium border border-emerald-500/30 transition flex items-center gap-2 ml-4"
                                                >
                                                    Open
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleImportFile(file.id, file.name, file.mimeType)}
                                                    disabled={importingFileId === file.id}
                                                    className="flex-shrink-0 px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white disabled:opacity-50 disabled:hover:bg-blue-600/20 rounded-lg text-sm font-medium border border-blue-500/30 transition flex items-center gap-2 ml-4"
                                                >
                                                    {importingFileId === file.id ? <Loader2 size={16} className="animate-spin" /> : null}
                                                    {importingFileId === file.id ? 'Importing...' : 'Import to AI'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}