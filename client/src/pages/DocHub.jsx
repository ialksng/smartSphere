import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FileText, Trash2, Save, Download } from "lucide-react";

export default function DocHub() {
  const location = useLocation();

  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

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
      setDocs(data);

      if (location.state?.docId) {
        openDoc(location.state.docId);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    await fetch(`/projects/smartsphere/api/dochub/${selectedDoc._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      },
      body: JSON.stringify({ content })
    });

    alert("Saved!");
  };

  const deleteDoc = async () => {
    await fetch(`/projects/smartsphere/api/dochub/${selectedDoc._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      }
    });

    setSelectedDoc(null);
    fetchDocs();
  };

  const downloadDoc = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = selectedDoc.filename;
    a.click();
  };

  return (
    <div className="flex h-full">

      {/* LEFT SIDEBAR */}
      <div className="w-72 border-r border-white/10 p-4 overflow-y-auto bg-white/5">
        <h2 className="text-lg font-semibold mb-4">Documents</h2>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : docs.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents found</p>
        ) : (
          docs.map(doc => (
            <div
              key={doc._id}
              onClick={() => openDoc(doc._id)}
              className={`p-3 rounded-lg cursor-pointer mb-2 transition ${
                selectedDoc?._id === doc._id
                  ? "bg-blue-600/20 text-blue-400"
                  : "hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={14} />
                <p className="text-sm truncate">{doc.filename}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 p-6">

        {selectedDoc ? (
          <>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedDoc.filename}</h2>
                <p className="text-xs text-gray-400">
                  {selectedDoc.contentType.toUpperCase()}
                </p>
              </div>

              <div className="flex gap-3">
                {selectedDoc.contentType === 'text' && (
                  <button onClick={saveDoc} className="hover:text-blue-400">
                    <Save size={18} />
                  </button>
                )}
                <button onClick={deleteDoc} className="hover:text-red-400">
                  <Trash2 size={18} />
                </button>
                <button onClick={downloadDoc} className="hover:text-green-400">
                  <Download size={18} />
                </button>
              </div>
            </div>

            {/* PREVIEW */}
            <div className="h-[75vh] bg-white/5 rounded-xl p-4 overflow-auto border border-white/10">

              {/* TEXT EDITOR */}
              {selectedDoc.contentType === 'text' && (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full bg-transparent outline-none resize-none"
                />
              )}

              {/* PDF */}
              {selectedDoc.contentType === 'pdf' && selectedDoc.fileUrl && (
                <iframe
                  src={selectedDoc.fileUrl}
                  className="w-full h-full rounded"
                  title="PDF Preview"
                />
              )}

              {/* IMAGE */}
              {selectedDoc.contentType === 'image' && selectedDoc.fileUrl && (
                <img
                  src={selectedDoc.fileUrl}
                  alt={selectedDoc.filename}
                  className="max-h-full mx-auto rounded-lg"
                />
              )}

            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a document to view
          </div>
        )}

      </div>
    </div>
  );
}