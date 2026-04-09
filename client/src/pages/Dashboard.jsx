import ChatInterface from '../components/ChatInterface';

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-darkBg text-white p-4 pt-8 md:p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Sidebar: File Explorer Placeholder */}
                <div className="col-span-1 bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl p-6 h-[600px] flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 border-b border-glassBorder pb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Cloud Hub
                    </h2>
                    
                    <div className="flex-1 flex flex-col justify-center items-center text-center space-y-4 text-gray-400">
                        <p className="text-sm">File Explorer & Aggregation<br/>Coming Soon</p>
                    </div>

                    <div className="mt-auto space-y-3 pt-4 border-t border-glassBorder">
                        <button className="w-full bg-white/5 hover:bg-white/10 border border-glassBorder py-2.5 rounded-lg transition text-sm font-medium">
                            Connect Google Drive
                        </button>
                        <button className="w-full bg-white/5 hover:bg-white/10 border border-glassBorder py-2.5 rounded-lg transition text-sm font-medium">
                            Connect OneDrive
                        </button>
                    </div>
                </div>

                {/* Main Content: Chat Interface */}
                <div className="col-span-1 lg:col-span-3">
                    <ChatInterface />
                </div>
            </div>
        </div>
    );
}