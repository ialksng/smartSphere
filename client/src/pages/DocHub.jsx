import { useEffect, useState } from "react";
import { Folder, FileText, Upload, ArrowLeft } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const DocHub = () => {
  const [items, setItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderStack, setFolderStack] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
  });

  useEffect(() => {
    fetchItems();
  }, [currentFolder]);

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

  const openFolder = (id) => {
    setFolderStack(prev => [...prev, currentFolder]);
    setCurrentFolder(id);
    setSelectedFile(null);
  };

  const goBack = () => {
    const prev = folderStack[folderStack.length - 1] || null;
    setFolderStack(stack => stack.slice(0, -1));
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
    } catch (err) {
      alert("Upload failed");
    }
  };

  return (
    <div className="flex h-full">

      <div className="w-80 border-r p-4 bg-white/5">

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
              onClick={() => item.type === 'folder' ? openFolder(item._id) : openFile(item._id)}
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

    </div>
  );
};

export default DocHub;