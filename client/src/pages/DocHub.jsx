import { useEffect, useState } from "react";
import { FileText, Star, Trash2, Plus, Search, Cloud } from "lucide-react";

const DocHub = () => {
  const [items, setItems] = useState([]);
  const [view, setView] = useState("home");
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

  const createFile = async () => {
    const type = prompt("Create in: local / google / onedrive");
    if (!type) return;

    if (type === "local") {
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
    } else {
      alert(`Cloud creation (${type}) coming next`);
    }
  };

  const openFile = async (file) => {
    const res = await fetch(`/projects/smartsphere/api/dochub/${file._id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
      }
    });

    const data = await res.json();
    setSelectedFile(data);
    setView("editor");
  };

  const downloadFile = (file) => {
    const blob = new Blob([file.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    a.click();
  };

  const uploadToDrive = async (file) => {
    await fetch("/projects/smartsphere/api/cloud/google/upload-dochub", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
      },
      body: JSON.stringify({ fileId: file._id })
    });

    alert("Uploaded to Google Drive");
  };

  const sendToBuddy = async (file) => {
    await fetch("/projects/smartsphere/api/ai/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
      },
      body: JSON.stringify({ text: file.content })
    });

    alert("Sent to BuddyBot");
  };

  if (view === "editor" && selectedFile) {
    return (
      <div className="p-6 bg-[#0b0f19] text-white min-h-screen">
        <button
          onClick={() => setView("home")}
          className="mb-4 text-sm text-blue-400"
        >
          ← Back
        </button>

        <h2 className="text-xl mb-4">{selectedFile.filename}</h2>

        <textarea
          defaultValue={selectedFile.content}
          className="w-full h-[70vh] bg-white text-black p-4 rounded"
        />
      </div>
    );
  }

  if (view === "files") {
    return (
      <div className="p-6 bg-[#0b0f19] text-white min-h-screen">

        <button
          onClick={() => setView("home")}
          className="mb-4 text-sm text-blue-400"
        >
          ← Back
        </button>

        <h2 className="text-xl mb-6">All Files</h2>

        <div className="space-y-3">
          {items.map(file => (
            <div
              key={file._id}
              className="p-4 bg-white/5 border border-white/10 rounded-lg flex justify-between items-center"
            >
              <div>
                <p>{file.filename}</p>
                <p className="text-xs text-gray-400">
                  {file.source || "local"} • {file.size || 0} B
                </p>
              </div>

              <div className="flex gap-2 text-sm">
                <button onClick={() => openFile(file)}>Open</button>
                <button onClick={() => downloadFile(file)}>Download</button>
                <button onClick={() => uploadToDrive(file)}>Drive</button>
                <button onClick={() => sendToBuddy(file)}>Buddy</button>
              </div>
            </div>
          ))}
        </div>

      </div>
    );
  }

  return (
    <div className="p-8 bg-[#0b0f19] text-white min-h-screen">

      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg mb-8 max-w-xl">
        <Search size={16} />
        <input
          placeholder="Search anything..."
          className="bg-transparent outline-none w-full"
        />
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div
          onClick={createFile}
          className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl cursor-pointer"
        >
          <Plus />
          <h3 className="mt-2">New Document</h3>
        </div>

        <div className="p-6 bg-white/5 rounded-xl cursor-pointer">
          <Star />
          <h3 className="mt-2">Favorites</h3>
        </div>

        <div className="p-6 bg-white/5 rounded-xl cursor-pointer">
          <Trash2 />
          <h3 className="mt-2">Trash</h3>
        </div>

        <div
          onClick={() => setView("files")}
          className="p-6 bg-white/5 rounded-xl cursor-pointer"
        >
          <Cloud />
          <h3 className="mt-2">All Files</h3>
        </div>

      </div>

    </div>
  );
};

export default DocHub;