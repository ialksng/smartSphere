import { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';

export default function ChatInterface() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = { role: 'user', text: input };
        setMessages([...messages, userMsg]);
        setInput("");

        // Simulated API Call to backend
        setTimeout(() => {
            const aiMsg = { role: 'ai', text: "Processing your request via Smart Sphere..." };
            setMessages(prev => [...prev, aiMsg]);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto bg-glassBg backdrop-blur-md border border-glassBorder rounded-2xl shadow-2xl overflow-hidden text-white">
            
            {/* Header */}
            <div className="p-4 border-b border-glassBorder bg-white/5">
                <h2 className="text-xl font-semibold">BuddyBot AI</h2>
                <p className="text-xs text-gray-400">Powered by Gemini & Groq</p>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-[80%] ${
                            msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'
                        }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-glassBorder bg-white/5 flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-full transition">
                    <Paperclip size={20} className="text-gray-300" />
                </button>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your files or chat..." 
                    className="flex-1 bg-transparent border border-glassBorder rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
                />
                <button 
                    onClick={handleSend}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition flex items-center justify-center">
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}