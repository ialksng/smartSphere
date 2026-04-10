import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FileText } from "lucide-react";

const DocHub = () => {
  const location = useLocation();

  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState("");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch('/projects/smartsphere/api/dochub', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        }
      });

      const data = await res.json();
      setDocs(data.docs || []);
      setRemaining(data.remaining || 0);

      if (location.state?.docId) {
        openDoc(location.state.docId);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const openDoc = async (id) => {
    try {
      const res = await fetch(`/projects/smartsphere/api/dochub/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        }
      });

      const data = await res.json();
      setSelectedDoc(data);
      setContent(data.content || "");

    } catch (err) {
      console.error(err);
    }
  };

  const saveDoc = async () => {
    if (!selectedDoc) return;

    await fetch(`/projects/smartsphere/api/dochub/${selectedDoc._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ content })
    });

    fetchDocs();
  };

  return (
    <div className="flex h-full">

      <div className="w-72 border-r border-white/10 p-4 bg-white/5">
        <h2 className="text-lg font-semibold mb-2">Documents</h2>

        <p className="text-xs text-gray-400 mb-4">
          Remaining: {(remaining / (1024 * 1024)).toFixed(2)} MB
        </p>

        {docs.map(doc => (
          <div
            key={doc._id}
            onClick={() => openDoc(doc._id)}
            className={`p-3 rounded-lg cursor-pointer mb-2 ${
              selectedDoc?._id === doc._id
                ? "bg-blue-600/20 text-blue-400"
                : "hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={14} />
              <p className="text-sm truncate">{doc.filename}</p>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              {doc.source === "google" && "Google Drive"}
              {doc.source === "onedrive" && "OneDrive"}
              {doc.source === "local" && "Local"}
            </p>
          </div>
        ))}
      </div>

      <div className="flex-1 p-6 flex flex-col">
        {selectedDoc ? (
          <>
            <div className="flex justify-between mb-3">
              <h2 className="font-semibold">{selectedDoc.filename}</h2>
              <button
                onClick={saveDoc}
                className="px-4 py-1 bg-blue-600 rounded"
              >
                Save
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full flex-1 bg-transparent outline-none resize-none"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a document
          </div>
        )}
      </div>

    </div>
  );
};

export default DocHub;