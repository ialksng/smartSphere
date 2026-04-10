import { useNavigate } from "react-router-dom";
import { ArrowLeft, HardDrive } from "lucide-react";

export default function MyStorage() {
  const navigate = useNavigate();

  return (
    <div className="p-8 text-white bg-[#0b0f19] min-h-full">

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded hover:bg-white/10"
        >
          <ArrowLeft size={18} />
        </button>

        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <HardDrive className="text-blue-400" />
          My Storage
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div
          onClick={() => navigate('/dochub')}
          className="p-6 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition"
        >
          <h2 className="text-lg font-semibold mb-2">📄 Documents</h2>
          <p className="text-sm text-gray-400">Manage your local documents</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-2">🖼 Media</h2>
          <p className="text-sm text-gray-400">Coming soon</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold mb-2">📦 Files</h2>
          <p className="text-sm text-gray-400">Coming soon</p>
        </div>

      </div>

    </div>
  );
}