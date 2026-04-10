import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, HardDrive, Upload, FileText } from "lucide-react";

export default function MyStorage() {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [used, setUsed] = useState(0);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const res = await fetch('/projects/smartsphere/api/dochub', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      }
    });

    const data = await res.json();
    setFiles(data || []);

    const total = data.reduce((acc, f) => acc + (f.size || 0), 0);
    setUsed(total);
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    await fetch('/projects/smartsphere/api/dochub/upload', {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: formData
    });

    fetchFiles();
  };

  const uploadToDrive = async (fileId) => {
    await fetch('/projects/smartsphere/api/cloud/google/upload-local', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ fileId })
    });

    alert("Uploaded to Google Drive");
  };

  const openFile = (file) => {
    navigate('/dochub', {
      state: { fileId: file._id }
    });
  };

  const percent = Math.min((used / (500 * 1024 * 1024)) * 100, 100);

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

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>{(used / (1024 * 1024)).toFixed(1)} MB used</span>
          <span>500 MB</span>
        </div>

        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <label className="px-4 py-2 bg-blue-600 rounded cursor-pointer flex items-center gap-2">
          <Upload size={16} />
          Upload
          <input
            type="file"
            hidden
            onChange={(e) => handleUpload(e.target.files[0])}
          />
        </label>

        <button
          onClick={() => navigate('/dochub')}
          className="px-4 py-2 bg-white/10 rounded"
        >
          Open DocHub
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-4">Files</h2>

      <div className="grid md:grid-cols-4 gap-4">
        {files.map(file => (
          <div
            key={file._id}
            className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <div
              onClick={() => openFile(file)}
              className="cursor-pointer"
            >
              <FileText className="text-blue-400 mb-2" size={20} />
              <p className="text-sm truncate">{file.filename}</p>
            </div>

            <button
              onClick={() => uploadToDrive(file._id)}
              className="mt-2 text-xs text-green-400"
            >
              Upload to Drive
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}