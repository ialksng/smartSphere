import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, FileText, FileUp, HardDrive, Cloud, X } from 'lucide-react';

export default function ChatInterface({ onInsightAdded }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false); // NEW: Toggle for multi-source menu
    
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', text: input };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput("");
        setIsLoading(true);

        try {
            // Filter out system/UI messages so the AI doesn't get confused by "Uploading..." text
            const cleanHistory = newHistory
                .filter(msg => !msg.isSystem)
                .slice(-6);

            const res = await fetch('/projects/smartsphere/api/ai/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sphere_token')}`
                },
                body: JSON.stringify({ 
                    message: input, 
                    history: cleanHistory 
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                setMessages([...newHistory, { role: 'ai', text: data.reply }]);
            } else {
                setMessages([...newHistory, { role: 'ai', text: `Error: ${data.message}`, isSystem: true }]);
            }
        } catch (error) {
            setMessages([...newHistory, { role: 'ai', text: "Connection error occurred.", isSystem: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setShowAttachMenu(false); // Close menu on upload start

        const uploadMsg = { role: 'user', type: 'file', fileName: file.name, text: `Uploading ${file.name}...`, isSystem: true };
        setMessages(prev => [...prev, uploadMsg]);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/projects/smartsphere/api/ai/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('sphere_token')}`
                },
                body: formData
            });

            const data = await res.json();
            
            if (res.ok) {
                setMessages(prev => [
                    ...prev.slice(0, -1), // Remove the "Uploading..." placeholder
                    { role: 'user', type: 'file', fileName: file.name, text: `Attached: ${file.name}`, isSystem: true },
                    { role: 'ai', text: `I've successfully read **${file.name}**. Here is a quick summary:\n\n${data.summary}\n\nYou can now ask me follow-up questions about this document.` }
                ]);
                
                if (onInsightAdded) onInsightAdded(); 
            } else {
                setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: `Upload failed: ${data.message}`, isSystem: true }]);
            }
        } catch (error) {
            setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: "Failed to upload file.", isSystem: true }]);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; 
        }
    };

    // Placeholder functions for cloud imports
    const handleDriveImport = () => {
        setShowAttachMenu(false);
        alert("Integrate Google Drive Picker Here");
        // In a real scenario, you'd open your Drive picker, get the file blob/ID, and send it to your upload route
    };

    const handleMyStorageImport = () => {
        setShowAttachMenu(false);
        alert("Open SmartSphere Storage Modal Here");
        // In a real scenario, you'd allow them to pick an existing document from DocHub
    };

    return (
        <div className="flex flex-col h-full w-full bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl overflow-hidden text-white relative">
            {/* Header */}
            <div className="p-4 border-b border-glassBorder bg-white/5 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">BuddyBot AI</h2>
                    <p className="text-xs text-gray-400">Context-Aware Document Analysis</p>
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
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm text-center">
                        <FileText size={48} className="mb-4 text-white/20" />
                        <p>Ask a question or upload a file to begin.</p>
                        <p className="text-xs mt-2 opacity-60">I can read PDFs, DOCX, TXT, and MD files.</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3.5 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 border border-blue-500 rounded-tr-sm text-white' 
                                : 'bg-white/10 border border-glassBorder rounded-tl-sm text-gray-200'
                        }`}>
                            {msg.type === 'file' ? (
                                <div className="flex items-center gap-2">
                                    {msg.text.includes('Uploading') ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16}/>}
                                    <span className="font-medium">{msg.text}</span>
                                </div>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                {(isLoading && !isUploading) && (
                    <div className="flex justify-start">
                        <div className="p-3.5 rounded-2xl bg-white/10 border border-glassBorder rounded-tl-sm">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-glassBorder bg-white/5 flex items-center gap-3 relative">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.md"
                />
                
                {/* Multi-Source Attachment Wrapper */}
                <div className="relative">
                    <button 
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        disabled={isUploading || isLoading}
                        className={`p-2 rounded-full transition disabled:opacity-50 ${showAttachMenu ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                        {showAttachMenu ? <X size={20} /> : <Paperclip size={20} />}
                    </button>

                    {/* Pop-up Menu */}
                    {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 w-56 bg-gray-900 border border-glassBorder rounded-xl shadow-2xl overflow-hidden z-20 flex flex-col">
                            <button 
                                onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm text-left transition text-gray-200 hover:text-white">
                                <FileUp size={18} className="text-blue-400" />
                                Upload from Device
                            </button>
                            <button 
                                onClick={handleMyStorageImport}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm text-left transition border-t border-glassBorder text-gray-200 hover:text-white">
                                <HardDrive size={18} className="text-emerald-400" />
                                Select from Storage
                            </button>
                            <button 
                                onClick={handleDriveImport}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm text-left transition border-t border-glassBorder text-gray-200 hover:text-white">
                                <Cloud size={18} className="text-amber-400" />
                                Import from Google Drive
                            </button>
                        </div>
                    )}
                </div>

                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading || isUploading}
                    placeholder="Ask BuddyBot a question..." 
                    className="flex-1 bg-black/30 border border-glassBorder rounded-full px-5 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition placeholder-gray-500"
                />
                
                <button 
                    onClick={handleSend}
                    disabled={isLoading || isUploading || !input.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-full transition flex items-center justify-center text-white shadow-lg">
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}