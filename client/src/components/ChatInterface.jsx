import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, FileText, FileUp, HardDrive, Cloud, X, Box, ChevronRight, Folder, ArrowLeft } from 'lucide-react';

export default function ChatInterface({ onInsightAdded }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // Menu States
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showCloudMenu, setShowCloudMenu] = useState(false);
    
    // Picker Modal States
    const [isMyStorageModalOpen, setIsMyStorageModalOpen] = useState(false);
    const [myStorageFiles, setMyStorageFiles] = useState([]);
    const [isLoadingStorage, setIsLoadingStorage] = useState(false);

    const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
    const [driveFiles, setDriveFiles] = useState([]);
    const [isLoadingDrive, setIsLoadingDrive] = useState(false);
    const [currentDriveFolder, setCurrentDriveFolder] = useState({ id: 'root', name: 'My Drive' });
    const [driveFolderHistory, setDriveFolderHistory] = useState([]);

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // --- CHAT LOGIC ---
    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', text: input };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput("");
        setIsLoading(true);

        try {
            const cleanHistory = newHistory.filter(msg => !msg.isSystem).slice(-6);

            const res = await fetch('/projects/smartsphere/api/ai/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sphere_token')}`
                },
                body: JSON.stringify({ message: input, history: cleanHistory })
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

    // --- 1. LOCAL FILE UPLOAD ---
    const handleLocalUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setShowAttachMenu(false);
        setShowCloudMenu(false);

        const uploadMsg = { role: 'user', type: 'file', fileName: file.name, text: `Uploading ${file.name}...`, isSystem: true };
        setMessages(prev => [...prev, uploadMsg]);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/projects/smartsphere/api/ai/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('sphere_token')}` },
                body: formData
            });

            const data = await res.json();
            
            if (res.ok) {
                setMessages(prev => [
                    ...prev.slice(0, -1),
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

    // --- 2. MY STORAGE (DocHub) LOGIC ---
    const openMyStorageModal = async () => {
        setShowAttachMenu(false);
        setIsMyStorageModalOpen(true);
        setIsLoadingStorage(true);
        try {
            const res = await fetch('/projects/smartsphere/api/dochub', {
                headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` }
            });
            const data = await res.json();
            setMyStorageFiles(data || []);
        } catch (err) {
            console.error("Failed to load MyStorage", err);
        } finally {
            setIsLoadingStorage(false);
        }
    };

    const handleSelectMyStorageFile = async (file) => {
        setIsMyStorageModalOpen(false);
        setMessages(prev => [
            ...prev,
            { role: 'user', type: 'file', fileName: file.filename, text: `Attached from Storage: ${file.filename}`, isSystem: true },
            { role: 'ai', text: `I've acknowledged **${file.filename}** from your SmartSphere storage. What would you like to know about it?` }
        ]);
        // Note: For this to feed RAG, ensure DocHub items sync with your Insight database, 
        // or add logic to extract the DocHub content and send it to /api/ai/chat.
    };

    // --- 3. GOOGLE DRIVE LOGIC ---
    const openDriveModal = () => {
        setShowAttachMenu(false);
        setShowCloudMenu(false);
        setIsDriveModalOpen(true);
        setDriveFolderHistory([]);
        setCurrentDriveFolder({ id: 'root', name: 'My Drive' });
        fetchDriveData('root');
    };

    const fetchDriveData = async (folderId) => {
        setIsLoadingDrive(true);
        try {
            const res = await fetch(`/projects/smartsphere/api/cloud/google/files?folderId=${folderId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('sphere_token')}` }
            });
            const data = await res.json();
            setDriveFiles(data || []);
        } catch (err) {
            console.error("Failed to load Drive files", err);
        } finally {
            setIsLoadingDrive(false);
        }
    };

    const handleDriveFolderClick = (id, name) => {
        setDriveFolderHistory(prev => [...prev, currentDriveFolder]);
        setCurrentDriveFolder({ id, name });
        fetchDriveData(id);
    };

    const handleDriveBreadcrumbClick = (index) => {
        const newHistory = driveFolderHistory.slice(0, index);
        const folder = driveFolderHistory[index];
        setDriveFolderHistory(newHistory);
        setCurrentDriveFolder(folder);
        fetchDriveData(folder.id);
    };

    const handleSelectDriveFile = async (file) => {
        setIsDriveModalOpen(false);
        setIsUploading(true);
        
        setMessages(prev => [...prev, { role: 'user', type: 'file', fileName: file.name, text: `Importing ${file.name} from Google Drive...`, isSystem: true }]);

        try {
            const res = await fetch('/projects/smartsphere/api/cloud/google/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sphere_token')}`
                },
                body: JSON.stringify({ fileId: file.id, fileName: file.name, mimeType: file.mimeType })
            });
            const data = await res.json();

            if (res.ok) {
                setMessages(prev => [
                    ...prev.slice(0, -1),
                    { role: 'user', type: 'file', fileName: file.name, text: `Attached from Drive: ${file.name}`, isSystem: true },
                    { role: 'ai', text: `I've successfully imported and analyzed **${file.name}**.\n\nSummary:\n${data.insight?.summary || 'File is ready for discussion.'}` }
                ]);
                if (onInsightAdded) onInsightAdded();
            } else {
                setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: `Drive import failed: ${data.message}`, isSystem: true }]);
            }
        } catch (error) {
            setMessages(prev => [...prev.slice(0, -1), { role: 'ai', text: "Failed to import from Google Drive.", isSystem: true }]);
        } finally {
            setIsUploading(false);
        }
    };

    // --- UI HELPERS ---
    const toggleAttachMenu = () => {
        setShowAttachMenu(!showAttachMenu);
        setShowCloudMenu(false); 
    };

    return (
        <div className="flex flex-col h-full w-full bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl overflow-hidden text-white relative">
            
            {/* --- MODALS OVERLAYS --- */}
            {/* MyStorage Modal */}
            {isMyStorageModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0b0f19] border border-glassBorder rounded-2xl w-full max-w-md h-[70%] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-glassBorder flex items-center justify-between bg-white/5">
                            <h3 className="font-semibold flex items-center gap-2"><HardDrive size={18} className="text-emerald-400"/> Select from Storage</h3>
                            <button onClick={() => setIsMyStorageModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {isLoadingStorage ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-400" size={24}/></div>
                            ) : myStorageFiles.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">No files found in DocHub</div>
                            ) : (
                                myStorageFiles.map(file => (
                                    <button key={file._id} onClick={() => handleSelectMyStorageFile(file)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-transparent hover:border-white/10 text-left">
                                        <FileText className="text-blue-400" size={18} />
                                        <span className="text-sm truncate flex-1">{file.filename}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Google Drive Modal */}
            {isDriveModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0b0f19] border border-glassBorder rounded-2xl w-full max-w-lg h-[80%] flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-glassBorder flex items-center justify-between bg-white/5">
                            <h3 className="font-semibold flex items-center gap-2"><Cloud size={18} className="text-amber-400"/> Google Drive Picker</h3>
                            <button onClick={() => setIsDriveModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                        </div>
                        
                        {/* Drive Breadcrumbs */}
                        <div className="px-4 py-3 bg-black/40 border-b border-glassBorder flex items-center gap-2 text-xs text-gray-400 overflow-x-auto">
                            <button onClick={() => { setCurrentDriveFolder({id: 'root', name: 'My Drive'}); setDriveFolderHistory([]); fetchDriveData('root'); }} className="hover:text-white whitespace-nowrap">My Drive</button>
                            {driveFolderHistory.map((f, i) => (
                                <div key={f.id} className="flex items-center gap-2 whitespace-nowrap">
                                    <ChevronRight size={12} />
                                    <button onClick={() => handleDriveBreadcrumbClick(i)} className="hover:text-white">{f.name}</button>
                                </div>
                            ))}
                            <ChevronRight size={12} />
                            <span className="text-white whitespace-nowrap">{currentDriveFolder.name}</span>
                        </div>

                        {/* Drive File List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {isLoadingDrive ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" size={24}/></div>
                            ) : driveFiles.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">Folder is empty</div>
                            ) : (
                                <>
                                    {driveFiles.filter(f => f.mimeType.includes('folder')).map(folder => (
                                        <button key={folder.id} onClick={() => handleDriveFolderClick(folder.id, folder.name)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition border border-transparent hover:border-white/10 text-left">
                                            <Folder className="text-emerald-400" size={18} />
                                            <span className="text-sm truncate flex-1">{folder.name}</span>
                                            <ChevronRight size={16} className="text-gray-500"/>
                                        </button>
                                    ))}
                                    {driveFiles.filter(f => !f.mimeType.includes('folder')).map(file => (
                                        <button key={file.id} onClick={() => handleSelectDriveFile(file)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-blue-600/20 transition border border-transparent hover:border-blue-500/30 text-left">
                                            <FileText className="text-blue-400" size={18} />
                                            <span className="text-sm truncate flex-1">{file.name}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* --- END MODALS --- */}


            {/* Main Chat Header */}
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

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 relative z-0">
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
                                    {(msg.text.includes('Uploading') || msg.text.includes('Importing')) ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16}/>}
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
            <div className="p-4 border-t border-glassBorder bg-white/5 flex items-center gap-3 relative z-10">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleLocalUpload} 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.md"
                />
                
                <div className="relative">
                    <button 
                        onClick={toggleAttachMenu}
                        disabled={isUploading || isLoading}
                        className={`p-2 rounded-full transition disabled:opacity-50 ${showAttachMenu ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                        {showAttachMenu ? <X size={20} /> : <Paperclip size={20} />}
                    </button>

                    {showAttachMenu && (
                        <div className="absolute bottom-12 left-0 w-56 bg-gray-900 border border-glassBorder rounded-xl shadow-2xl overflow-hidden flex flex-col">
                            <button 
                                onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm text-left transition text-gray-200 hover:text-white">
                                <FileUp size={18} className="text-gray-400" />
                                Device
                            </button>
                            
                            <button 
                                onClick={openMyStorageModal}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-sm text-left transition border-t border-glassBorder text-gray-200 hover:text-white">
                                <HardDrive size={18} className="text-emerald-400" />
                                MyStorage
                            </button>

                            <button 
                                onClick={() => setShowCloudMenu(!showCloudMenu)}
                                className={`flex items-center justify-between px-4 py-3 text-sm text-left transition border-t border-glassBorder text-gray-200 hover:text-white ${showCloudMenu ? 'bg-white/10' : 'hover:bg-white/10'}`}>
                                <div className="flex items-center gap-3">
                                    <Cloud size={18} className="text-blue-400" />
                                    CloudHub
                                </div>
                                <ChevronRight size={16} className={`transition-transform duration-200 ${showCloudMenu ? 'rotate-90 text-white' : 'text-gray-500'}`} />
                            </button>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-black/40 ${showCloudMenu ? 'max-h-40 border-t border-glassBorder' : 'max-h-0'}`}>
                                <button 
                                    onClick={openDriveModal}
                                    className="flex items-center w-full gap-3 px-8 py-2.5 hover:bg-white/10 text-xs text-left transition text-gray-300 hover:text-white">
                                    <Cloud size={14} className="text-amber-400" />
                                    Google Drive
                                </button>
                                <button 
                                    onClick={() => alert("OneDrive integration coming soon.")}
                                    className="flex items-center w-full gap-3 px-8 py-2.5 hover:bg-white/10 text-xs text-left transition text-gray-300 hover:text-white">
                                    <Cloud size={14} className="text-blue-500" />
                                    OneDrive
                                </button>
                                <button 
                                    onClick={() => alert("Dropbox integration coming soon.")}
                                    className="flex items-center w-full gap-3 px-8 py-2.5 hover:bg-white/10 text-xs text-left transition text-gray-300 hover:text-white">
                                    <Box size={14} className="text-blue-400" />
                                    Dropbox
                                </button>
                            </div>
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