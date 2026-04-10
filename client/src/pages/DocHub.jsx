import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FileText } from "lucide-react";

const DocHub = () => {
  const location = useLocation();

  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState("");

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

  return (
    <div className="flex h-full">

      {/* LEFT */}
      <div className="w-72 border-r border-white/10 p-4 bg-white/5">
        <h2 className="text-lg font-semibold mb-4">Documents</h2>

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
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div className="flex-1 p-6">
        {selectedDoc ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-transparent outline-none resize-none"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a document
          </div>
        )}
      </div>

    </div>
  );
};

export default DocHub; // 🔥 THIS LINE FIXES YOUR BUILD ERROR