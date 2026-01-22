
import React, { useState } from 'react';
import { db } from '../services/db';

interface AuthProps {
    onLogin: (username: string) => void;
    onCancel: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onCancel }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!username || !password) {
            setError("Please fill in all fields.");
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                const isAuthenticated = await db.authenticateUser(username, password);
                if (isAuthenticated) {
                    onLogin(username);
                } else {
                    setError("Invalid username or password.");
                }
            } else {
                await db.registerUser(username, password);
                onLogin(username);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative">
             <button 
                onClick={onCancel}
                className="absolute top-6 right-6 text-sm font-bold text-eunoia-500 hover:text-indigo-600 px-4 py-2 rounded-lg hover:bg-white transition-all"
             >
                 Back to Home
             </button>

             {/* Logo / Brand */}
             <div className="mb-8 flex flex-col items-center animate-fade-in">
                <div className="w-16 h-16 bg-indigo-600 rounded-br-2xl rounded-tl-2xl flex items-center justify-center text-white text-2xl font-serif font-bold mb-4 shadow-xl shadow-indigo-200">
                    E
                </div>
                <h1 className="text-4xl font-serif text-eunoia-900 tracking-tight">EUNOIA</h1>
                <p className="text-eunoia-500 font-light tracking-wide mt-2">Decision Intelligence Platform</p>
             </div>

             {/* Auth Card */}
             <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-eunoia-100 p-8 md:p-10 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                
                <h2 className="text-2xl font-serif text-eunoia-800 mb-6 text-center">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-eunoia-400 uppercase tracking-widest mb-1.5">Username</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-50 border border-eunoia-200 rounded-xl px-4 py-3 text-eunoia-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-eunoia-400 uppercase tracking-widest mb-1.5">Password</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-eunoia-200 rounded-xl px-4 py-3 text-eunoia-900 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg border border-rose-100 flex items-center gap-2">
                             <span className="font-bold">!</span> {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all duration-200 mt-2 flex justify-center items-center ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            isLogin ? 'Sign In' : 'Sign Up'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-eunoia-50">
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="text-sm text-eunoia-500 hover:text-indigo-600 transition-colors"
                    >
                        {isLogin ? "Don't have an account? Create one." : "Already have an account? Sign in."}
                    </button>
                </div>
             </div>

             <div className="mt-8 text-xs text-eunoia-300 font-medium tracking-widest uppercase text-center">
                Secure • IndexedDB • Private
            </div>
        </div>
    );
};
