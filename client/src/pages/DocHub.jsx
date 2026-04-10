import { useEffect, useState } from "react";
import { Folder, FileText, Upload, ArrowLeft } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const DocHub = () => {
  const [items, setItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [menu, setMenu] = useState(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
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
    setFolderStack(prev => [...prev, currentFolder]);
    setBreadcrumb(prev => [...prev, { id, name }]);
    setCurrentFolder(id);
    setSelectedFile(null);
  };

  const goBack = () => {
    const prev = folderStack[folderStack.length - 1] || null;
    setFolderStack(stack => stack.slice(0, -1));
    setBreadcrumb(b => b.slice(0, -1));
    setCurrentFolder(prev);
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

    const html = editor.getHTML();

    await fetch(`/projects/smartsphere/api/dochub/${selectedFile._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ content: html })
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
    <div className="flex h-full">

      <div className="w-80 border-r p-4 bg-white/5">

        <div className="flex items-center gap-2 text-sm mb-4 text-gray-400 flex-wrap">
          <span
            className="cursor-pointer"
            onClick={() => {
              setCurrentFolder(null);
              setBreadcrumb([]);
            }}
          >
            Home
          </span>

          {breadcrumb.map((b, i) => (
            <span key={b.id} className="flex items-center gap-2">
              /
              <span
                className="cursor-pointer"
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

        <div className="flex gap-2 mb-4">
          <button onClick={createFolder} className="px-2 py-1 bg-white/10 rounded">+ Folder</button>
          <button onClick={createFile} className="px-2 py-1 bg-white/10 rounded">+ File</button>
        </div>

        {currentFolder && (
          <button onClick={goBack} className="flex items-center gap-2 text-sm mb-3 text-gray-400">
            <ArrowLeft size={16} />
            Back
          </button>
        )}

        <div className="space-y-2">
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
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-white/10 rounded"
            >
              {item.type === 'folder'
                ? <Folder size={18} className="text-yellow-400" />
                : <FileText size={18} className="text-blue-400" />}
              <span className="text-sm">{item.filename}</span>
            </div>
          ))}
        </div>

      </div>

      <div className="flex-1 p-6 flex flex-col">
        {selectedFile ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{selectedFile.filename}</h2>

              <div className="flex gap-2">
                <button onClick={saveFile} className="px-3 py-1 bg-blue-600 rounded text-sm">
                  Save
                </button>

                <button
                  onClick={uploadToDrive}
                  className="px-3 py-1 bg-green-600 rounded text-sm flex items-center gap-1"
                >
                  <Upload size={16} />
                  Drive
                </button>
              </div>
            </div>

            <div className="bg-white text-black rounded p-4 flex-1 overflow-auto">
              <EditorContent editor={editor} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a file
          </div>
        )}
      </div>

      {menu && (
        <div
          style={{ top: menu.y, left: menu.x }}
          className="fixed bg-black border border-white/10 rounded shadow-lg z-50"
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