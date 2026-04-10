import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Loader2, CloudUpload } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const DocEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[70vh] text-black leading-relaxed',
      },
    },
  });

  useEffect(() => {
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
           setSelectedFile(data);
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
      // Intelligently parse plain text into HTML paragraphs so TipTap formats it properly
      const contentToSet = selectedFile.content.includes('<') 
        ? selectedFile.content 
        : `<p>${selectedFile.content.replace(/\n/g, '<br>')}</p>`;
        
      editor.commands.setContent(contentToSet);
    }
  }, [selectedFile, editor]);

  const saveFile = async () => {
    if (!selectedFile || !editor) return;
    setSaving(true);
    try {
      await fetch(`/projects/smartsphere/api/dochub/${selectedFile._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        },
        body: JSON.stringify({
          content: editor.getHTML() // Save HTML markup from the editor
        })
      });
      alert("Saved locally successfully!");
    } catch (err) {
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const syncToCloud = async () => {
    if (!selectedFile) return;
    try {
      const endpoint = selectedFile.source === 'google_drive' 
        ? '/projects/smartsphere/api/cloud/google/upload-dochub'
        : '';
        
      if (!endpoint) {
          alert("Cloud sync for this provider is not setup yet.");
          return;
      }

      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        },
        body: JSON.stringify({ fileId: selectedFile._id })
      });
      alert("Synced edits back to Google Drive successfully!");
    } catch (err) {
      alert("Failed to sync to cloud.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!selectedFile) return null;

  // Treat 'text' or 'undefined' as editable formats.
  const isEditable = selectedFile.contentType === 'text' || !selectedFile.contentType;

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

        <div className="flex gap-3">
          {/* Cloud Sync Button */}
          {(selectedFile.source === 'google_drive' || selectedFile.source === 'onedrive') && (
             <button 
               onClick={syncToCloud} 
               className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors text-sm"
             >
               <CloudUpload size={16} /> Sync to Cloud
             </button>
          )}
          
          {/* Native Save Button */}
          {isEditable && (
            <button 
              onClick={saveFile} 
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              {saving ? "Saving..." : "Save Edits"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden p-4">
        {selectedFile.contentType === "pdf" && selectedFile.fileUrl ? (
          // Modifies the Google Drive URL to enforce embeddable preview layout
          <iframe 
            src={selectedFile.fileUrl.replace(/\/view.*$/, '/preview')} 
            className="w-full h-full min-h-[75vh] rounded bg-white" 
            title="PDF Preview"
          />
        ) : selectedFile.contentType === "image" && selectedFile.fileUrl ? (
          <img src={selectedFile.fileUrl} className="max-h-[75vh] mx-auto rounded" alt={selectedFile.filename} />
        ) : (
          <div className="bg-white rounded-lg p-8 h-full min-h-[75vh]">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocEditor;