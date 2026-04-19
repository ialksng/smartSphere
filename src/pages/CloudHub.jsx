import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cloud, HardDrive } from "lucide-react";
import apiClient from "../services/apiClient";

export default function CloudHub() {
  const navigate = useNavigate();

  const [googleStorage, setGoogleStorage] = useState(null);

  useEffect(() => {
    fetchStorage();
  }, []);

  const fetchStorage = async () => {
    try {
      const res = await apiClient.get('/cloud/google/storage');
      setGoogleStorage(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatGB = (bytes) => {
    return (bytes / (1024 ** 3)).toFixed(2);
  };

  const totalUsed = googleStorage?.used || 0;
  const totalLimit = googleStorage?.total || 1;

  return (
    <div className="p-8">

      <h1 className="text-2xl font-semibold mb-6">CloudHub</h1>

      <div className="mb-8 p-6 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <HardDrive className="text-emerald-400" />
          <h2 className="text-lg font-medium">Total Storage</h2>
        </div>

        <p className="text-sm text-gray-400 mb-2">
          Across all connected clouds
        </p>

        <p className="text-xl font-semibold">
          {formatGB(totalUsed)} GB / {formatGB(totalLimit)} GB
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        <div
          onClick={() => navigate('/cloudhub/google')}
          className="p-6 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 bg-blue-500/10"
        >
          <Cloud className="mb-3 text-blue-400" />
          <h2 className="text-lg">Google Drive</h2>

          {googleStorage ? (
            <p className="text-sm text-gray-400 mt-2">
              {formatGB(googleStorage.used)} / {formatGB(googleStorage.total)} GB used
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Loading...</p>
          )}
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-indigo-500/10">
          <Cloud className="mb-3 text-indigo-400" />
          <h2 className="text-lg">OneDrive</h2>
          <p className="text-sm text-gray-500 mt-2">Not connected</p>
        </div>

        <div className="p-6 rounded-2xl border border-white/10 bg-purple-500/10">
          <Cloud className="mb-3 text-purple-400" />
          <h2 className="text-lg">Dropbox</h2>
          <p className="text-sm text-gray-500 mt-2">Not connected</p>
        </div>

      </div>
    </div>
  );
}