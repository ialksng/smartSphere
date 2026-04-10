import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const DocEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  const editor = useEditor({
    extensions: [StarterKit],
    content: ""
  });

  useEffect(() => {
    // Get the docId passed from either Dashboard or DocHub navigation
    const docId = location.state?.docId;
    
    if (!docId) {
      navigate('/dochub');
      return;
    }

    const fetchFile = async () => {
      try {
        const res = await fetch(`/projects/smartsphere/api/dochub/${docId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
          }
        });
        const data = await res.json();
        
        if (data && data._id) {
           if ((data.source === "google_drive" || data.source === "onedrive") && data.fileUrl) {
              window.open(data.fileUrl, "_blank");
              navigate(-1); // Go back if external
           } else {
             setSelectedFile(data);
           }
        } else {
           navigate('/dochub');
        }
      } catch (err) {
        console.error("Failed to load document", err);
        navigate('/dochub');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [location.state, navigate]);

  useEffect(() => {
    if (editor && selectedFile && selectedFile.content !== undefined) {
      editor.commands.setContent(selectedFile.content);
    }
  }, [selectedFile, editor]);

  const saveFile = async () => {
    if (!selectedFile || !editor) return;

    try {
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
      alert("Saved successfully!");
    } catch (err) {
      alert("Failed to save.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!selectedFile) return null;

  return (
    <div className="p-6 bg-[#0b0f19] text-white min-h-screen flex flex-col">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 text-blue-400 flex items-center gap-2 hover:text-blue-300 w-fit"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">{selectedFile.filename}</h2>

        <button 
          onClick={saveFile} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Save size={18} /> Save
        </button>
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden p-4">
        {selectedFile.contentType === "pdf" && selectedFile.fileUrl ? (
          <iframe src={selectedFile.fileUrl} className="w-full h-full min-h-[75vh] rounded" />
        ) : selectedFile.contentType === "image" && selectedFile.fileUrl ? (
          <img src={selectedFile.fileUrl} className="max-h-[75vh] mx-auto rounded" alt={selectedFile.filename} />
        ) : (
          <EditorContent
            editor={editor}
            className="bg-white text-black p-6 rounded-lg min-h-[75vh] prose max-w-none focus:outline-none"
          />
        )}
      </div>
    </div>
  );
};

export default DocEditor;