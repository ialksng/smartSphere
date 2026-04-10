import { useEffect, useState } from "react";
import { FileText, Star, Trash2, Plus, Search, Cloud, Save } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const DocHub = () => {
  const [items, setItems] = useState([]);
  const [view, setView] = useState("home");
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: ""
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (editor && selectedFile) {
      editor.commands.setContent(selectedFile.content || "");
    }
  }, [selectedFile, editor]);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch("/projects/smartsphere/api/dochub", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
      }
    });
    const data = await res.json();
    setItems(data || []);
    setLoading(false);
  };

  const getSourceIcon = (source) => {
    if (source === "google_drive") return "🟢";
    if (source === "onedrive") return "🔵";
    return "💻";
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

  const openFile = async (file) => {
    if (file.source === "google_drive" && file.fileUrl) {
      window.open(file.fileUrl, "_blank");
      return;
    }

    const res = await fetch(`/projects/smartsphere/api/dochub/${file._id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
      }
    });

    const data = await res.json();
    setSelectedFile(data);
    setView("editor");
  };

  const saveFile = async () => {
    if (!selectedFile || !editor) return;

    await fetch(`/projects/smartsphere/api/dochub/${selectedFile._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
      },
      body: JSON.stringify({
        content: editor.getHTML()
      })
    });

    alert("Saved");
  };

  const downloadFile = (file) => {
    const blob = new Blob([file.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename;
    a.click();
  };

  const filteredItems = items.filter(f =>
    f.filename.toLowerCase().includes(search.toLowerCase())
  );

  if (view === "editor" && selectedFile) {
    return (
      <div className="p-6 bg-[#0b0f19] text-white min-h-screen">

        <button onClick={() => setView("home")} className="mb-4 text-blue-400">
          ← Back
        </button>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl">{selectedFile.filename}</h2>

          <button onClick={saveFile} className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded">
            <Save size={16} /> Save
          </button>
        </div>

        {selectedFile.contentType === "pdf" && selectedFile.fileUrl ? (
          <iframe src={selectedFile.fileUrl} className="w-full h-[80vh]" />
        ) : selectedFile.contentType === "image" && selectedFile.fileUrl ? (
          <img src={selectedFile.fileUrl} className="max-h-[80vh] mx-auto" />
        ) : (
          <EditorContent
            editor={editor}
            className="bg-white text-black p-4 rounded h-[70vh]"
          />
        )}

      </div>
    );
  }

  if (view === "files") {
    return (
      <div className="p-6 bg-[#0b0f19] text-white min-h-screen">

        <button onClick={() => setView("home")} className="mb-4 text-blue-400">
          ← Back
        </button>

        <h2 className="text-xl mb-4">All Files</h2>

        <input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 p-2 w-full bg-white/10 rounded"
        />

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(file => (
              <div
                key={file._id}
                className="p-4 bg-white/5 border border-white/10 rounded-lg flex justify-between"
              >
                <div>
                  <p>{file.filename}</p>
                  <p className="text-xs text-gray-400">
                    {getSourceIcon(file.source)} {file.source} • {file.size || 0} B
                  </p>
                </div>

                <div className="flex gap-2 text-sm">
                  <button onClick={() => openFile(file)}>Open</button>
                  <button onClick={() => downloadFile(file)}>Download</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="p-8 bg-[#0b0f19] text-white min-h-screen">

      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg mb-8 max-w-xl">
        <Search size={16} />
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full"
        />
      </div>

      <div className="grid md:grid-cols-4 gap-6">

        <div onClick={createFile} className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl cursor-pointer">
          <Plus />
          <h3 className="mt-2">New Document</h3>
        </div>

        <div className="p-6 bg-white/5 rounded-xl">
          <Star />
          <h3 className="mt-2">Favorites</h3>
        </div>

        <div className="p-6 bg-white/5 rounded-xl">
          <Trash2 />
          <h3 className="mt-2">Trash</h3>
        </div>

        <div onClick={() => setView("files")} className="p-6 bg-white/5 rounded-xl cursor-pointer">
          <Cloud />
          <h3 className="mt-2">All Files</h3>
        </div>

      </div>

    </div>
  );
};

export default DocHub;