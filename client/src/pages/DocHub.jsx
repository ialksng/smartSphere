import { useEffect, useState } from "react";
import { FileText, Trash2, Save, Download } from "lucide-react";
import { Document, Page } from "react-pdf";

export default function DocHub() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    const res = await fetch('/api/dochub', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      }
    });
    const data = await res.json();
    setDocs(data);
  };

  const openDoc = async (id) => {
    const res = await fetch(`/api/dochub/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('sphere_token')}`
      }
    });

    const data = await res.json();
    setSelectedDoc(data);
    setContent(data.content);
  };

  const saveDoc = async () => {
    await fetch(`/api/dochub/${selectedDoc._id}`, {
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
    await fetch(`/api/dochub/${selectedDoc._id}`, {
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
    <div className="flex h-screen bg-[#0b0f1a] text-white">

      {/* LEFT PANEL */}
      <div className="w-80 border-r border-white/10 p-4 overflow-y-auto">
        <h2 className="font-bold mb-4">DocHub</h2>

        {docs.map(doc => (
          <div
            key={doc._id}
            onClick={() => openDoc(doc._id)}
            className="p-3 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <FileText size={16} />
            <p className="text-sm truncate">{doc.filename}</p>
          </div>
        ))}
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

            {/* SMART PREVIEW */}
            <div className="h-[80vh] bg-white/5 rounded-xl p-4 overflow-auto">

              {/* TEXT EDITOR */}
              {selectedDoc.contentType === 'text' && (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full bg-transparent outline-none resize-none"
                />
              )}

              {/* PDF VIEWER */}
              {selectedDoc.contentType === 'pdf' && (
                <div className="flex justify-center">
                  <iframe
                    src={selectedDoc.fileUrl}
                    className="w-full h-[75vh] rounded"
                    title="PDF Preview"
                  />
                </div>
              )}

              {/* IMAGE VIEWER */}
              {selectedDoc.contentType === 'image' && (
                <div className="flex justify-center">
                  <img
                    src={selectedDoc.fileUrl}
                    alt={selectedDoc.filename}
                    className="max-h-[70vh] rounded-lg"
                  />
                </div>
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