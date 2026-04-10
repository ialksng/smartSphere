import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Cloud, FileText,
  BrainCircuit, HardDrive
} from "lucide-react";

export default function MainLayout({ children }) {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold text-blue-400">SmartSphere</h1>
          <p className="text-xs text-gray-400">AI Workspace</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">

          <NavItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            onClick={() => navigate('/dashboard')}
          />

          <NavItem
            icon={<FileText size={18} />}
            label="DocHub"
            onClick={() => navigate('/dochub')}
          />

          <NavItem
            icon={<Cloud size={18} />}
            label="Google Drive"
            onClick={() => navigate('/cloudhub/google')}
          />

          <NavItem
            icon={<BrainCircuit size={18} />}
            label="AI Insights"
          />

          <NavItem
            icon={<HardDrive size={18} />}
            label="Storage"
          />

        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}

function NavItem({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}