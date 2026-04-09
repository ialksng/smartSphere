import { useState } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';

export default function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', text: input };
        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInput("");
        setIsLoading(true);

        try {
            // Note: Relative path relies on the same origin. 
            // In dev, you might need a Vite proxy. In prod, this works flawlessly.
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('sphere_token')}`
                },
                body: JSON.stringify({ 
                    message: input, 
                    history: messages.slice(-6) // Send last 6 messages for context
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

    return (
        <div className="flex flex-col h-[600px] w-full bg-glassBg backdrop-blur-xl border border-glassBorder rounded-2xl shadow-2xl overflow-hidden text-white">
            <div className="p-4 border-b border-glassBorder bg-white/5 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">BuddyBot AI</h2>
                    <p className="text-xs text-gray-400">Gemini Primary • Groq Fallback</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">Online</span>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                        Ask a question or upload a file to begin...
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3.5 rounded-2xl max-w-[80%] text-sm whitespace-pre-wrap leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-blue-600/80 border border-blue-500/50 rounded-tr-sm' 
                                : 'bg-white/10 border border-glassBorder rounded-tl-sm'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="p-3.5 rounded-2xl bg-white/10 border border-glassBorder rounded-tl-sm">
                            <Loader2 size={16} className="animate-spin text-gray-400" />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-glassBorder bg-white/5 flex items-center gap-3">
                <button className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
                    <Paperclip size={20} />
                </button>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isLoading}
                    placeholder="Message Smart Sphere..." 
                    className="flex-1 bg-black/20 border border-glassBorder rounded-full px-5 py-2.5 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
                />
                <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-full transition flex items-center justify-center">
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}