import { useState } from 'react';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            
            if (res.ok) {
                localStorage.setItem('sphere_token', data.token);
                // Here we will eventually redirect to the Dashboard
                alert('Success! Logged in as ' + data.name);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error(error);
            alert('Server error');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md bg-glassBg border border-glassBorder rounded-2xl shadow-2xl backdrop-blur-xl p-8 z-10">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Smart Sphere
                    </h2>
                    <p className="text-gray-400 mt-2">{isLogin ? 'Welcome back, innovator.' : 'Join the AI cloud revolution.'}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input 
                                type="text" 
                                placeholder="Full Name" 
                                className="w-full bg-white/5 border border-glassBorder rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition"
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                            type="email" 
                            placeholder="Email Address" 
                            className="w-full bg-white/5 border border-glassBorder rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition"
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            className="w-full bg-white/5 border border-glassBorder rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition"
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            required
                        />
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 group">
                        {isLogin ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="text-center text-gray-400 mt-6 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button 
                        onClick={() => setIsLogin(!isLogin)} 
                        className="text-blue-400 hover:text-blue-300 ml-2 font-medium transition"
                    >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    );
}