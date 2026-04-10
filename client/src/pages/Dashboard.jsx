import { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import { 
    LayoutDashboard, Cloud, BrainCircuit, FileText, 
    Settings, LogOut, ChevronRight, HardDrive, Loader2, X 
} from 'lucide-react';

export default function Dashboard() {
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- NEW: Google Drive State ---
    const [driveFiles, setDriveFiles] = useState([]);
    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [isDriveLoading, setIsDriveLoading] = useState(false);
    const [importingFileId, setImportingFileId] = useState(null);

    const fetchInsights = async () => {
        try {
            const res = await fetch('/projects/smartsphere/api/ai/insights', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sphere_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInsights(data);
            }
        } catch (error) {
            console.error("Failed to fetch insights", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Smart Google Drive Handler ---
    const handleGoogleDriveClick = async () => {
        setIsDriveLoading(true);
        try {
            // 1. Try to fetch files (Assuming we are already connected)
            const res = await fetch('/projects/smartsphere/api/cloud/google/files', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sphere_token')}` }
            });

            if (res.ok) {
                // Successfully connected! Show the files in the modal.
                const files = await res.json();
                setDriveFiles(files);
                setIsDriveModalOpen(true);
            } else if (res.status === 401) {
                // Not connected yet. Initiate the OAuth login flow.
                const token = localStorage.getItem('sphere_token');
                if (!token) return;
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.id;

                const authRes = await fetch(`/projects/smartsphere/api/cloud/google/auth?userId=${userId}`);
                const authData = await authRes.json();
                if (authData.url) window.location.href = authData.url;
            }
        } catch (error) {
            console.error("Failed to communicate with Google Drive", error);
        } finally {
            setIsDriveLoading(false);
        }
    };

    // --- NEW: Import File Handler ---
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
                // Refresh the dashboard list to show the newly imported file
                await fetchInsights(); 
                setIsDriveModalOpen(false); // Close the modal
                alert(`Successfully imported ${fileName}! You can now ask BuddyBot about it.`);
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

    useEffect(() => {
        fetchInsights();
    }, []);

    // --- NEW: Handle OAuth Redirect URL Parameters ---
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const cloudStatus = urlParams.get('cloud');

        if (cloudStatus) {
            if (cloudStatus === 'success') {
                alert('Successfully connected to Google Drive!');
                // Open the modal immediately to show files upon successful return
                handleGoogleDriveClick();
            } else if (cloudStatus === 'error') {
                alert('Failed to connect to Google Drive. Please check your backend server logs.');
            }

            // Clean up the URL so it doesn't re-trigger on a normal page refresh
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="h-screen w-full bg-darkBg text-white flex overflow-hidden relative">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[20%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* COLUMN 1: Sidebar & Multi-Cloud Aggregator */}
            <aside className="w-64 bg-glassBg backdrop-blur-2xl border-r border-glassBorder flex flex-col z-10">
                <div className="p-6 border-b border-glassBorder">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        SmartSphere
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">AI Cloud Intelligence</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active />
                    <NavItem icon={<FileText size={18} />} label="My Documents" />
                    <NavItem icon={<BrainCircuit size={18} />} label="RAG Insights" />

                    <div className="pt-6 pb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">Cloud Hub</p>
                    </div>
                    {/* Wired to the smart click handler */}
                    <NavItem 
                        icon={isDriveLoading ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <Cloud size={18} className="text-blue-400" />} 
                        label="Google Drive" 
                        onClick={handleGoogleDriveClick} 
                    />
                    <NavItem icon={<Cloud size={18} className="text-blue-600" />} label="OneDrive" />
                    <NavItem icon={<HardDrive size={18} />} label="Local Storage" />
                </nav>

                <div className="p-4 border-t border-glassBorder">
                    <button className="flex items-center gap-3 text-gray-400 hover:text-white transition w-full px-3 py-2 rounded-lg hover:bg-white/5">
                        <Settings size={18} />
                        <span className="text-sm font-medium">Settings</span>
                    </button>
                    <button className="flex items-center gap-3 text-red-400 hover:text-red-300 transition w-full px-3 py-2 rounded-lg hover:bg-red-500/10 mt-1">
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* COLUMN 2: Main Dashboard & Insights Layer */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto z-10 relative">
                <header className="p-8 pb-4">
                    <h2 className="text-3xl font-semibold">Intelligence Overview</h2>
                    <p className="text-gray-400 text-sm mt-1">Your unified knowledge base and document insights.</p>
                </header>

                <div className="p-8 pt-4 space-y-6 flex-1">
                    {/* Top Level Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Processed Documents" value={insights.length} icon={<FileText size={24} className="text-blue-400" />} />
                        <StatCard title="AI Insights Generated" value={insights.length * 3} icon={<BrainCircuit size={24} className="text-emerald-400" />} />
                        <StatCard title="Cloud Storage Synced" value="Local" icon={<HardDrive size={24} className="text-purple-400" />} />
                    </div>

                    {/* RAG System Recent Activity */}
                    <div className="bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Recent Document Insights</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="flex justify-center p-4 text-blue-400">
                                    <Loader2 className="animate-spin" size={24} />
                                </div>
                            ) : insights.length === 0 ? (
                                <div className="text-center p-6 text-gray-500 text-sm border border-dashed border-glassBorder rounded-xl">
                                    No documents analyzed yet. Upload a file in the chat to begin!
                                </div>
                            ) : (
                                insights.map((doc) => (
                                    <div key={doc._id} className="flex flex-col p-4 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 transition group cursor-pointer">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm text-white group-hover:text-blue-400 transition">{doc.filename}</h4>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Processed on {new Date(doc.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-300 pl-14 pr-4 pb-2 border-l-2 border-blue-500/30 ml-5 mt-1">
                                            {doc.summary}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* --- GOOGLE DRIVE MODAL --- */}
                {isDriveModalOpen && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8 z-50">
                        <div className="bg-[#0f172a] border border-glassBorder w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-full">
                            <div className="p-6 border-b border-glassBorder flex justify-between items-center bg-white/5">
                                <div className="flex items-center gap-3">
                                    <Cloud className="text-blue-400" size={24} />
                                    <h2 className="text-xl font-semibold">Google Drive Hub</h2>
                                </div>
                                <button onClick={() => setIsDriveModalOpen(false)} className="text-gray-400 hover:text-white transition">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                                {driveFiles.length === 0 ? (
                                    <p className="text-center text-gray-400 text-sm py-8">No files found in your Google Drive.</p>
                                ) : (
                                    driveFiles.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 transition group">
                                            <div className="flex items-center gap-4">
                                                <FileText size={20} className="text-blue-400/70" />
                                                <div>
                                                    <h4 className="font-medium text-sm text-white truncate max-w-xs">{file.name}</h4>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Modified {new Date(file.modifiedTime).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleImportFile(file.id, file.name, file.mimeType)}
                                                disabled={importingFileId === file.id}
                                                className="px-4 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white disabled:opacity-50 disabled:hover:bg-blue-600/20 rounded-lg text-xs font-medium border border-blue-500/30 transition flex items-center gap-2"
                                            >
                                                {importingFileId === file.id ? <Loader2 size={14} className="animate-spin" /> : null}
                                                {importingFileId === file.id ? 'Importing...' : 'Import to AI'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* COLUMN 3: AI Assistant (BuddyBot) */}
            <aside className="w-[400px] p-4 bg-black/20 border-l border-glassBorder z-10 flex flex-col h-full shadow-2xl">
                <ChatInterface onInsightAdded={fetchInsights} />
            </aside>
        </div>
    );
}

// --- Internal Helper Components ---
function NavItem({ icon, label, active, badge, onClick }) {
    return (
        <button 
            onClick={onClick} 
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition ${active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent cursor-pointer'}`}
        >
            <div className="flex items-center gap-3">
                {icon}
                <span className="text-sm font-medium">{label}</span>
            </div>
            {badge && <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{badge}</span>}
        </button>
    );
}

function StatCard({ title, value, icon }) {
    return (
        <div className="bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl p-6 shadow-xl flex items-center gap-5 transition hover:bg-white/5">
            <div className="p-4 bg-white/5 border border-glassBorder rounded-xl">
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
        </div>
    );
}