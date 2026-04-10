import { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import { 
    LayoutDashboard, Cloud, BrainCircuit, FileText, 
    Settings, LogOut, ChevronRight, HardDrive, FileImage 
} from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="h-screen w-full bg-darkBg text-white flex overflow-hidden relative">
            {/* Background Blobs for Glassmorphism Depth */}
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
                    <NavItem icon={<Cloud size={18} className="text-blue-400" />} label="Google Drive" badge="Connected" />
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
            <main className="flex-1 flex flex-col h-full overflow-y-auto z-10">
                <header className="p-8 pb-4">
                    <h2 className="text-3xl font-semibold">Intelligence Overview</h2>
                    <p className="text-gray-400 text-sm mt-1">Your unified knowledge base and document insights.</p>
                </header>

                <div className="p-8 pt-4 space-y-6 flex-1">
                    {/* Top Level Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Processed Documents" value="24" icon={<FileText size={24} className="text-blue-400" />} />
                        <StatCard title="AI Insights Generated" value="142" icon={<BrainCircuit size={24} className="text-emerald-400" />} />
                        <StatCard title="Cloud Storage Synced" value="1.2 GB" icon={<HardDrive size={24} className="text-purple-400" />} />
                    </div>

                    {/* RAG System Recent Activity */}
                    <div className="bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold">Recent Document Insights</h3>
                            <button className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
                                View Library <ChevronRight size={16} />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Document Item 1 */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 transition group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-white group-hover:text-blue-400 transition">Q3_Financial_Report.pdf</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">Extracted 3 key insights • Google Drive</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/30 transition">
                                    Analyze
                                </button>
                            </div>

                            {/* Document Item 2 */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-glassBorder hover:bg-white/10 transition group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                                        <FileImage size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-white group-hover:text-emerald-400 transition">System_Architecture_v2.png</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">Vision analysis complete • Local Upload</p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-lg text-xs font-medium border border-blue-500/30 transition">
                                    Analyze
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* COLUMN 3: AI Assistant (BuddyBot) */}
            <aside className="w-[400px] p-4 bg-black/20 border-l border-glassBorder z-10 flex flex-col h-full shadow-2xl">
                <ChatInterface />
            </aside>
        </div>
    );
}

// --- Internal Helper Components ---

function NavItem({ icon, label, active, badge }) {
    return (
        <button className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition ${active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
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