import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Save, ArrowLeft, Loader2, CloudUpload, Bot, X, Send } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const DocEditor = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // BuddyBot States
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-full text-black leading-relaxed',
      },
    },
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

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
           
           // Initialize BuddyBot context for this document
           setChatHistory([
             {
               role: 'ai',
               text: `**Document Summary:**\n${data.summary || "No summary available for this file."}\n\nI'm ready! Ask me anything about this document.`
             }
           ]);

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
          content: editor.getHTML()
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
      alert("Synced edits back to cloud successfully!");
    } catch (err) {
      alert("Failed to sync to cloud.");
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      // Secretly prepend document context to the prompt so the bot knows what to answer
      const hiddenContext = `[Context Document Name: "${selectedFile.filename}". Document Text: ${selectedFile.content ? selectedFile.content.substring(0, 3000) : "No text content"}]\n\nUser Question: `;
      
      const res = await fetch('/projects/smartsphere/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("sphere_token")}`
        },
        body: JSON.stringify({
          message: hiddenContext + userMsg,
          history: chatHistory.map(h => ({ role: h.role, text: h.text }))
        })
      });

      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply || "Sorry, I couldn't process that." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error connecting to BuddyBot." }]);
    } finally {
      setChatLoading(false);
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

  const isEditable = selectedFile.contentType === 'text' || !selectedFile.contentType;

  return (
    <div className="p-6 bg-[#0b0f19] text-white min-h-[calc(100vh-64px)] flex flex-col">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 text-blue-400 flex items-center gap-2 hover:text-blue-300 w-fit"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold truncate max-w-md">{selectedFile.filename}</h2>

        <div className="flex gap-3">
          {/* BuddyBot Toggle */}
          <button 
            onClick={() => setIsBotOpen(!isBotOpen)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${isBotOpen ? 'bg-indigo-600 text-white' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40'}`}
          >
            <Bot size={16} /> {isBotOpen ? "Close BuddyBot" : "Ask BuddyBot"}
          </button>

          {(selectedFile.source === 'google_drive' || selectedFile.source === 'onedrive') && (
             <button 
               onClick={syncToCloud} 
               className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors text-sm"
             >
               <CloudUpload size={16} /> Sync to Cloud
             </button>
          )}
          
          {isEditable && (
            <button 
              onClick={saveFile} 
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 h-[75vh]">
        {/* Main Editor/Viewer Area */}
        <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden p-4 relative h-full flex flex-col">
          {selectedFile.contentType === "pdf" && selectedFile.fileUrl ? (
            <iframe 
              src={selectedFile.fileUrl.replace(/\/view.*$/, '/preview')} 
              className="w-full h-full rounded bg-white" 
              title="PDF Preview"
            />
          ) : selectedFile.contentType === "image" && selectedFile.fileUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-black/50 rounded">
                <img src={selectedFile.fileUrl} className="max-h-full max-w-full rounded" alt={selectedFile.filename} />
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 h-full overflow-y-auto">
              <EditorContent editor={editor} className="prose max-w-none h-full" />
            </div>
          )}
        </div>

        {/* BuddyBot Sidebar */}
        {isBotOpen && (
          <div className="w-96 bg-[#131b2f] border border-white/10 rounded-xl flex flex-col h-full shrink-0 shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-indigo-600/10">
              <h3 className="font-semibold flex items-center gap-2 text-indigo-400">
                <Bot size={18} /> BuddyBot Context
              </h3>
              <button onClick={() => setIsBotOpen(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-xl max-w-[85%] text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white/10 text-gray-200 rounded-bl-none whitespace-pre-wrap'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-xl rounded-bl-none text-gray-400 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this document..."
                className="flex-1 bg-[#0b0f19] border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || chatLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 p-2 rounded-lg transition-colors flex items-center justify-center text-white"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocEditor;