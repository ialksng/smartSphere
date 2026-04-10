// client/src/pages/GoogleDriveHub.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, FileText, Loader2, ArrowLeft, Search } from 'lucide-react';

export default function GoogleDriveHub() {
    const navigate = useNavigate();
    const [driveFiles, setDriveFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [importingFileId, setImportingFileId] = useState(null);

    useEffect(() => {
        // 1. Check for URL parameters from OAuth redirect
        const urlParams = new URLSearchParams(window.location.search);
        const cloudStatus = urlParams.get('cloud');

        if (cloudStatus) {
            if (cloudStatus === 'success') {
                alert('Successfully connected to Google Drive!');
            } else if (cloudStatus === 'error') {
                alert('Failed to connect to Google Drive. Check server logs.');
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // 2. Fetch files or trigger login
        fetchDriveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDriveData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/projects/smartsphere/api/cloud/google/files', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sphere_token')}` }
            });

            if (res.ok) {
                const files = await res.json();
                setDriveFiles(files);
            } else if (res.status === 401) {
                // Not connected -> Redirect to Google OAuth
                const token = localStorage.getItem('sphere_token');
                if (!token) return;
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.id;

                const authRes = await fetch(`/projects/smartsphere/api/cloud/google/auth?userId=${userId}`);
                const authData = await authRes.json();
                if (authData.url) window.location.href = authData.url;
            }
        } catch (error) {
            console.error("Failed to fetch Google Drive files", error);
        } finally {
            setIsLoading(false);
        }
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
                alert(`Successfully imported ${fileName}! You can now ask BuddyBot about it in the Dashboard.`);
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
                {/* Header */}
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
                                Google Drive Hub
                            </h1>
                            <p className="text-gray-400 mt-1">Manage and import your cloud documents to SmartSphere AI.</p>
                        </div>
                    </div>
                </header>

                {/* File List Area */}
                <div className="bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl p-6 min-h-[500px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-blue-400">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p className="text-gray-400">Syncing with Google Drive...</p>
                        </div>
                    ) : driveFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Search size={48} className="mb-4 opacity-50" />
                            <p>No supported files found in your Google Drive.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {driveFiles.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 transition group">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400 flex-shrink-0">
                                            <FileText size={24} />
                                        </div>
                                        <div className="truncate">
                                            <h4 className="font-medium text-white truncate pr-4">{file.name}</h4>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleImportFile(file.id, file.name, file.mimeType)}
                                        disabled={importingFileId === file.id}
                                        className="flex-shrink-0 px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white disabled:opacity-50 disabled:hover:bg-blue-600/20 rounded-lg text-sm font-medium border border-blue-500/30 transition flex items-center gap-2 ml-4"
                                    >
                                        {importingFileId === file.id ? <Loader2 size={16} className="animate-spin" /> : null}
                                        {importingFileId === file.id ? 'Importing...' : 'Import to AI'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}