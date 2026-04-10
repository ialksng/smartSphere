import { useEffect, useState } from "react";
import { Folder, FileText, Search, Star, Trash2, Plus } from "lucide-react";

const DocHub = () => {
  const [items, setItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await fetch("/projects/smartsphere/api/dochub", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
      }
    });
    const data = await res.json();
    setItems(data || []);
  };

  const openFile = (file) => {
    setSelectedFile(file);
  };

  const createFile = async () => {
    const name = prompt("File name");
    if (!name) return;

    await fetch("/projects/smartsphere/api/dochub/file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
      },
      body: JSON.stringify({ filename: name, content: "" })
    });

    fetchItems();
  };

  return (
    <div className="flex h-screen bg-[#0b0f19] text-white">

      <div className="w-64 bg-[#111827] p-4 flex flex-col justify-between">

        <div>
          <h2 className="text-xl font-bold mb-6">DocHub</h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 cursor-pointer hover:text-blue-400">
              <Folder size={16} /> My Storage
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-blue-400">
              <FileText size={16} /> Recent
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-blue-400">
              <Star size={16} /> Favorites
            </div>
            <div className="flex items-center gap-2 cursor-pointer hover:text-blue-400">
              <Trash2 size={16} /> Trash
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl text-sm">
          <p className="mb-2">Become a PRO</p>
          <button className="bg-white text-black px-3 py-1 rounded text-xs">
            Upgrade
          </button>
        </div>

      </div>

      <div className="flex-1 p-6 overflow-auto">

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg w-80">
            <Search size={16} />
            <input
              placeholder="Search files..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <div className="text-sm">Hi, John 👋</div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">

          <div
            onClick={() => {
              const choice = prompt("Create in: local / cloud");
              if (!choice) return;

              if (choice === "local") {
                createFile();
              } else {
                const cloud = prompt("Which cloud: google / onedrive");
                alert(`Will create in ${cloud}`);
              }
            }}
            className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 cursor-pointer hover:scale-105 transition"
          >
            <Plus className="mb-2" />
            <h2 className="text-lg font-semibold mb-1">New Document</h2>
            <p className="text-sm text-white/80">Create local or cloud</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
            <Star className="mb-2 text-yellow-400" />
            <h2 className="text-lg font-semibold mb-1">Favorites</h2>
            <p className="text-sm text-gray-400">Starred files</p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer">
            <Trash2 className="mb-2 text-red-400" />
            <h2 className="text-lg font-semibold mb-1">Trash</h2>
            <p className="text-sm text-gray-400">Deleted files</p>
          </div>

        </div>

        <h3 className="text-lg font-semibold mb-3">Recent Documents</h3>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {items.slice(0, 8).map(doc => (
            <div
              key={doc._id}
              onClick={() => openFile(doc)}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition"
            >
              <FileText className="text-blue-400 mb-2" size={20} />
              <p className="text-sm truncate">{doc.filename}</p>
            </div>
          ))}
        </div>

        <h3 className="text-lg font-semibold mb-3">All Files</h3>

        <div className="bg-[#111827] rounded-xl p-4 space-y-2">
          {items.map(file => (
            <div
              key={file._id}
              onClick={() => openFile(file)}
              className="flex justify-between items-center p-3 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {file.type === "folder"
                  ? <Folder size={18} className="text-yellow-400" />
                  : <FileText size={18} className="text-blue-400" />
                }
                <span className="text-sm">{file.filename}</span>
              </div>

              <span className="text-xs text-gray-400">
                {file.size || 0} B
              </span>
            </div>
          ))}
        </div>

      </div>

      <div className="w-80 bg-[#111827] p-4 border-l border-white/10">

        {selectedFile ? (
          <>
            <h3 className="text-md font-semibold mb-3">File Preview</h3>

            <div className="bg-white/10 h-40 rounded-lg mb-4 flex items-center justify-center text-gray-400">
              Preview
            </div>

            <p className="text-sm mb-2">{selectedFile.filename}</p>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Storage Details</h4>

              <div className="bg-white/10 p-4 rounded-lg text-center">
                <p className="text-lg font-bold">512 MB</p>
                <p className="text-xs text-gray-400">Used Storage</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Select a file to preview
          </div>
        )}

      </div>

    </div>
  );
};

export default DocHub;