import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { 
    LayoutDashboard, Cloud, BrainCircuit, FileText, 
    Settings, LogOut, HardDrive, Loader2 
} from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();
    const [insights, setInsights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        fetchInsights();
    }, []);

    return (
        <div className="h-screen w-full bg-darkBg text-white flex overflow-hidden relative">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[20%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* SIDEBAR */}
            <aside className="w-64 bg-glassBg backdrop-blur-2xl border-r border-glassBorder flex flex-col z-10">
                <div className="p-6 border-b border-glassBorder">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        SmartSphere
                    </h1>
                    <p className="text-xs text-gray-400 mt-1">AI Cloud Intelligence</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active />

                    {/* 🔥 DOCHUB LINK */}
                    <NavItem 
                        icon={<FileText size={18} />} 
                        label="My Documents"
                        onClick={() => navigate('/dochub')}
                    />

                    <NavItem icon={<BrainCircuit size={18} />} label="RAG Insights" />

                    <div className="pt-6 pb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                            Cloud Hub
                        </p>
                    </div>

                    <NavItem 
                        icon={<Cloud size={18} className="text-blue-400" />} 
                        label="Google Drive" 
                        onClick={() => navigate('/cloudhub/google')} 
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

            {/* MAIN */}
            <main className="flex-1 flex flex-col h-full overflow-y-auto z-10 relative">
                <header className="p-8 pb-4">
                    <h2 className="text-3xl font-semibold">Intelligence Overview</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Your unified knowledge base and document insights.
                    </p>
                </header>

                <div className="p-8 pt-4 space-y-6 flex-1">

                    {/* STATS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="Processed Documents" 
                            value={insights.length} 
                            icon={<FileText size={24} className="text-blue-400" />} 
                        />
                        <StatCard 
                            title="AI Insights Generated" 
                            value={insights.length * 3} 
                            icon={<BrainCircuit size={24} className="text-emerald-400" />} 
                        />
                        <StatCard 
                            title="Cloud Storage Synced" 
                            value="Local" 
                            icon={<HardDrive size={24} className="text-purple-400" />} 
                        />
                    </div>

                    {/* INSIGHTS */}
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
                                    No documents analyzed yet. Upload or import files to begin!
                                </div>
                            ) : (
                                insights.map((doc) => (
                                    <div 
                                        key={doc._id}
                                        onClick={() => navigate('/dochub', { state: { docId: doc._id } })}
                                        className="flex flex-col p-4 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 transition group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm text-white group-hover:text-blue-400 transition">
                                                    {doc.filename}
                                                </h4>
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
            </main>

            {/* AI PANEL */}
            <aside className="w-[400px] p-4 bg-black/20 border-l border-glassBorder z-10 flex flex-col h-full shadow-2xl">
                <ChatInterface onInsightAdded={fetchInsights} />
            </aside>
        </div>
    );
}

// --- Components ---
function NavItem({ icon, label, active, onClick }) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl transition ${
                active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
        >
            {icon}
            <span className="text-sm font-medium">{label}</span>
        </button>
    );
}

function StatCard({ title, value, icon }) {
    return (
        <div className="bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl p-6 shadow-xl flex items-center gap-5 hover:bg-white/5">
            <div className="p-4 bg-white/5 border border-glassBorder rounded-xl">
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-sm">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
        </div>
    );
}