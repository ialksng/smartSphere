import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail, User } from 'lucide-react';

export default function Auth() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // --- FIX: Added the base path to the endpoints ---
        const endpoint = isLogin 
            ? '/projects/smartsphere/api/auth/login' 
            : '/projects/smartsphere/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isLogin ? { 
                    email: formData.email, 
                    password: formData.password 
                } : formData)
            });

            const data = await res.json();

            if (res.ok) {
                // Save the JWT token to local storage
                localStorage.setItem('sphere_token', data.token);
                // Redirect to the dashboard
                navigate('/dashboard');
            } else {
                setError(data.message || 'Authentication failed. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-darkBg text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md bg-glassBg backdrop-blur-2xl border border-glassBorder rounded-3xl shadow-2xl p-8 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                        Smart Sphere
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {isLogin ? 'Welcome back to your intelligence hub.' : 'Create an account to get started.'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                <User size={18} />
                            </div>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required={!isLogin}
                                placeholder="Full Name"
                                className="w-full bg-black/20 border border-glassBorder rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                            <Mail size={18} />
                        </div>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Email Address"
                            className="w-full bg-black/20 border border-glassBorder rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                            <Lock size={18} />
                        </div>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Password"
                            className="w-full bg-black/20 border border-glassBorder rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 text-sm transition placeholder-gray-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl py-3 text-sm font-medium transition shadow-lg shadow-blue-500/20 flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-400 hover:text-blue-300 font-medium transition"
                        type="button"
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}