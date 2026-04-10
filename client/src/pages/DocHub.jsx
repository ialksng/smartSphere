import { useEffect, useState } from "react";
import { Folder, FileText, Upload } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const DocHub = () => {
  const [items, setItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [menu, setMenu] = useState(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: ""
  });

  useEffect(() => {
    fetchItems();
  }, [currentFolder]);

  useEffect(() => {
    const closeMenu = () => setMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const fetchItems = async () => {
    const res = await fetch(`/projects/smartsphere/api/dochub?parentId=${currentFolder || ''}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      }
    });

    const data = await res.json();
    setItems(data || []);
  };

  const createFolder = async () => {
    const name = prompt("Folder name");
    if (!name) return;

    await fetch('/projects/smartsphere/api/dochub/folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ name, parentId: currentFolder })
    });

    fetchItems();
  };

  const createFile = async () => {
    const name = prompt("File name");
    if (!name) return;

    await fetch('/projects/smartsphere/api/dochub/file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ filename: name, content: "", parentId: currentFolder })
    });

    fetchItems();
  };

  const openFolder = (id, name) => {
    setBreadcrumb(prev => [...prev, { id, name }]);
    setCurrentFolder(id);
    setSelectedFile(null);
  };

  const openFile = async (id) => {
    const res = await fetch(`/projects/smartsphere/api/dochub/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      }
    });

    const data = await res.json();
    setSelectedFile(data);

    if (editor) {
      editor.commands.setContent(data.content || "");
    }
  };

  const saveFile = async () => {
    if (!selectedFile || !editor) return;

    await fetch(`/projects/smartsphere/api/dochub/${selectedFile._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ content: editor.getHTML() })
    });
  };

  const uploadToDrive = async () => {
    if (!selectedFile) return;

    try {
      await fetch('/projects/smartsphere/api/cloud/google/upload-dochub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        },
        body: JSON.stringify({ fileId: selectedFile._id })
      });

      alert("Uploaded to Google Drive");
    } catch {
      alert("Upload failed");
    }
  };

  const handleRightClick = (e, item) => {
    e.preventDefault();
    setMenu({ x: e.pageX, y: e.pageY, item });
  };

  const renameItem = async () => {
    const name = prompt("New name", menu.item.filename);
    if (!name) return;

    await fetch(`/projects/smartsphere/api/dochub/${menu.item._id}/rename`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ name })
    });

    setMenu(null);
    fetchItems();
  };

  const deleteItem = async () => {
    if (!window.confirm("Delete this item?")) return;

    await fetch(`/projects/smartsphere/api/dochub/${menu.item._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      }
    });

    setMenu(null);
    setSelectedFile(null);
    fetchItems();
  };

  const handleDragStart = (e, item) => {
    e.dataTransfer.setData("itemId", item._id);
  };

  const handleDrop = async (e, folder) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData("itemId");

    await fetch(`/projects/smartsphere/api/dochub/${itemId}/move`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ parentId: folder._id })
    });

    fetchItems();
  };

  const allowDrop = (e) => e.preventDefault();

  return (
    <div className="flex h-full bg-[#0b0f19] text-white">

      <div className="w-72 bg-[#111827] border-r border-white/10 p-4 flex flex-col">

        <h2 className="text-lg font-semibold mb-4">DocHub</h2>

        <div className="flex gap-2 mb-4">
          <button onClick={createFolder} className="flex-1 py-1 bg-blue-600 rounded text-sm">
            + Folder
          </button>
          <button onClick={createFile} className="flex-1 py-1 bg-white/10 rounded text-sm">
            + File
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 flex-wrap">
          <span
            className="cursor-pointer hover:text-white"
            onClick={() => {
              setCurrentFolder(null);
              setBreadcrumb([]);
            }}
          >
            Home
          </span>

          {breadcrumb.map((b, i) => (
            <span key={b.id} className="flex items-center gap-1">
              /
              <span
                className="cursor-pointer hover:text-white"
                onClick={() => {
                  const newPath = breadcrumb.slice(0, i + 1);
                  setBreadcrumb(newPath);
                  setCurrentFolder(b.id);
                }}
              >
                {b.name}
              </span>
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {items.map(item => (
            <div
              key={item._id}
              draggable={item.type === 'file'}
              onDragStart={(e) => handleDragStart(e, item)}
              onDrop={(e) => item.type === 'folder' && handleDrop(e, item)}
              onDragOver={allowDrop}
              onClick={() =>
                item.type === 'folder'
                  ? openFolder(item._id, item.filename)
                  : openFile(item._id)
              }
              onContextMenu={(e) => handleRightClick(e, item)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 cursor-pointer transition"
            >
              {item.type === 'folder'
                ? <Folder size={18} className="text-yellow-400" />
                : <FileText size={18} className="text-blue-400" />}
              <span className="text-sm">{item.filename}</span>
            </div>
          ))}
        </div>

      </div>

      <div className="flex-1 flex flex-col">

        {selectedFile ? (
          <>
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-[#0f172a]">
              <h2 className="text-lg font-semibold">{selectedFile.filename}</h2>

              <div className="flex gap-2">
                <button onClick={saveFile} className="px-4 py-1 bg-blue-600 rounded text-sm">
                  Save
                </button>

                <button
                  onClick={uploadToDrive}
                  className="px-4 py-1 bg-green-600 rounded text-sm flex items-center gap-1"
                >
                  <Upload size={16} />
                  Drive
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              <div className="bg-white text-black max-w-4xl mx-auto rounded-xl shadow p-6 min-h-[600px]">
                <EditorContent editor={editor} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FileText size={40} />
            <p className="mt-2">Select or create a document</p>
          </div>
        )}

      </div>

      {menu && (
        <div
          style={{ top: menu.y, left: menu.x }}
          className="fixed bg-[#111827] border border-white/10 rounded-lg shadow-lg z-50"
        >
          <div onClick={renameItem} className="px-4 py-2 hover:bg-white/10 cursor-pointer text-sm">
            Rename
          </div>
          <div onClick={deleteItem} className="px-4 py-2 hover:bg-red-500/20 cursor-pointer text-sm text-red-400">
            Delete
          </div>
        </div>
      )}

    </div>
  );
};

export default DocHub;