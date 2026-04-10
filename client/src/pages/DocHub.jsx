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

      if (!res.ok) throw new Error("Failed to fetch docs");

      const data = await res.json();
      setDocs(data);

      // 🔥 AUTO OPEN DOC FROM DASHBOARD
      if (location.state?.docId) {
        openDoc(location.state.docId);
      }

    } catch (err) {
      console.error("DocHub fetch error:", err);
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

      if (!res.ok) throw new Error("Failed to fetch doc");

      const data = await res.json();
      setSelectedDoc(data);
      setContent(data.content || "");

    } catch (err) {
      console.error("Open doc error:", err);
    }
  };

  const saveDoc = async () => {
    try {
      await fetch(`/projects/smartsphere/api/dochub/${selectedDoc._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        },
        body: JSON.stringify({ content })
      });

      alert("Saved!");
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  };

  const deleteDoc = async () => {
    try {
      await fetch(`/projects/smartsphere/api/dochub/${selectedDoc._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
        }
      });

      setSelectedDoc(null);
      fetchDocs();
    } catch (err) {
      console.error(err);
    }
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
    <div className="flex h-screen bg-[#0b0f1a] text-white">

      {/* LEFT PANEL */}
      <div className="w-80 border-r border-white/10 p-4 overflow-y-auto">
        <h2 className="font-bold mb-4">DocHub</h2>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : docs.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents found</p>
        ) : (
          docs.map(doc => (
            <div
              key={doc._id}
              onClick={() => openDoc(doc._id)}
              className="p-3 rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <FileText size={16} />
              <p className="text-sm truncate">{doc.filename}</p>
            </div>
          ))
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 p-6">

        {selectedDoc ? (
          <>
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{selectedDoc.filename}</h2>

              <div className="flex gap-3">
                {selectedDoc.contentType === 'text' && (
                  <button onClick={saveDoc}><Save size={18} /></button>
                )}
                <button onClick={deleteDoc}><Trash2 size={18} /></button>
                <button onClick={downloadDoc}><Download size={18} /></button>
              </div>
            </div>

            {/* PREVIEW */}
            <div className="h-[80vh] bg-white/5 rounded-xl p-4 overflow-auto">

              {/* TEXT */}
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
                  className="w-full h-[75vh] rounded"
                  title="PDF Preview"
                />
              )}

              {/* IMAGE */}
              {selectedDoc.contentType === 'image' && selectedDoc.fileUrl && (
                <img
                  src={selectedDoc.fileUrl}
                  alt={selectedDoc.filename}
                  className="max-h-[70vh] mx-auto rounded-lg"
                />
              )}

            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a document to preview
          </div>
        )}

      </div>
    </div>
  );
}