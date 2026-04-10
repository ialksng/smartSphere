import { useEffect, useState } from "react";
import { Folder, FileText } from "lucide-react";

const DocHub = () => {
  const [items, setItems] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

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
    setItems(data);
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
    setCurrentFolder(id);
  };

  const openFile = async (id) => {
    const res = await fetch(`/projects/smartsphere/api/dochub/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      }
    });

    const data = await res.json();
    setSelectedFile(data);
    setContent(data.content || "");
  };

  const saveFile = async () => {
    await fetch(`/projects/smartsphere/api/dochub/${selectedFile._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ content })
    });
  };

  return (
    <div className="flex h-full">

      <div className="w-80 border-r p-4">
        <div className="flex gap-2 mb-4">
          <button onClick={createFolder}>+ Folder</button>
          <button onClick={createFile}>+ File</button>
        </div>

        {items.map(item => (
          <div
            key={item._id}
            onClick={() => item.type === 'folder' ? openFolder(item._id) : openFile(item._id)}
            className="p-2 cursor-pointer hover:bg-gray-200"
          >
            {item.type === 'folder' ? <Folder /> : <FileText />}
            {item.filename}
          </div>
        ))}
      </div>

      <div className="flex-1 p-4">
        {selectedFile ? (
          <>
            <h2>{selectedFile.filename}</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full"
            />
            <button onClick={saveFile}>Save</button>
          </>
        ) : (
          <p>Select file</p>
        )}
      </div>

    </div>
  );
};

export default DocHub;