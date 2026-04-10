import { useState, useRef } from 'react';
import { Send, Paperclip, Loader2, FileText } from 'lucide-react';

export default function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', text: input };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sphere_token')}`
                },
                body: JSON.stringify({ 
                    message: input, 
                    history: messages.slice(-6) 
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                setMessages([...newHistory, { role: 'ai', text: data.reply }]);
            } else {
                setMessages([...newHistory, { role: 'ai', text: `Error: ${data.message}` }]);
            }
        } catch (error) {
            setMessages([...newHistory, { role: 'ai', text: "Connection error occurred." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- NEW: Handle File Upload ---
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Add a temporary "uploading" message
        const uploadMsg = { role: 'user', type: 'file', fileName: file.name, text: `Uploading ${file.name}...` };
        setMessages(prev => [...prev, uploadMsg]);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/ai/upload', {
                method: 'POST',
                // Note: Do NOT set Content-Type header when sending FormData, the browser handles the boundary automatically
                body: formData
            });

            const data = await res.json();
            
            if (res.ok) {
                // Replace the temporary message with the AI's summary
                setMessages(prev => [
                    ...prev.slice(0, -1), // remove "Uploading..." msg
                    { role: 'user', type: 'file', fileName: file.name, text: `Attached: ${file.name}` },
                    { role: 'ai', text: `I've read **${file.name}**. Here is a quick summary:\n\n${data.summary}\n\nWhat would you like to know about it?` }
                ]);
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: `Upload failed: ${data.message}` }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Failed to upload file." }]);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl overflow-hidden text-white">
            {/* Header */}
            <div className="p-4 border-b border-glassBorder bg-white/5 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">BuddyBot AI</h2>
                    <p className="text-xs text-gray-400">Smart Sphere Document Analysis</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">Online</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        Ask a question or upload a PDF/DOCX to begin...
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3.5 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-blue-600/80 border border-blue-500/50 rounded-tr-sm' 
                                : 'bg-white/10 border border-glassBorder rounded-tl-sm'
                        }`}>
                            {/* Render File Attachment visually differently than text */}
                            {msg.type === 'file' ? (
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-white/80"/>
                                    <span className="font-medium">{msg.text}</span>
                                </div>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                {(isLoading || isUploading) && (
                    <div className="flex justify-start">
                        <div className="p-3.5 rounded-2xl bg-white/10 border border-glassBorder rounded-tl-sm">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-glassBorder bg-white/5 flex items-center gap-3">
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.md"
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isLoading}
                    className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white disabled:opacity-50">
                    <Paperclip size={20} />
                </button>
                
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading || isUploading}
                    placeholder="Message Smart Sphere..." 
                    className="flex-1 bg-black/20 border border-glassBorder rounded-full px-5 py-2.5 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || isUploading || !input.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-full transition flex items-center justify-center">
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}