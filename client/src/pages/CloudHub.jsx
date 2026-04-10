import { useNavigate } from "react-router-dom";
import { Cloud } from "lucide-react";

export default function CloudHub() {
  const navigate = useNavigate();

  const clouds = [
    {
      name: "Google Drive",
      color: "bg-blue-500/20",
      path: "/cloudhub/google"
    },
    {
      name: "OneDrive",
      color: "bg-indigo-500/20"
    },
    {
      name: "Dropbox",
      color: "bg-purple-500/20"
    }
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">CloudHub</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {clouds.map((cloud, i) => (
          <div
            key={i}
            onClick={() => cloud.path && navigate(cloud.path)}
            className={`p-6 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 ${cloud.color}`}
          >
            <Cloud className="mb-3" />
            <h2 className="text-lg">{cloud.name}</h2>
            <p className="text-sm text-gray-400 mt-1">
              Connect and manage files
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}