import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ShieldCheck, Briefcase, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { allService } from '../services/api';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'admin' // Default to admin for dashboard
    });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const autoData = params.get('auto');
        if (autoData) {
            try {
                // Correctly decode UTF-8 data from base64
                const userData = JSON.parse(decodeURIComponent(escape(atob(autoData))));
                if (userData && (userData.id || userData.email)) {
                    sessionStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem('user', JSON.stringify(userData)); // Set in both for persistence

                    // Trigger immediate sync
                    window.dispatchEvent(new Event('dashboard-login'));

                    // Redirect immediately
                    const target = userData.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/employer/profile';
                    navigate(target);
                }
            } catch (e) {
                console.error("Auto-login failed:", e);
            }
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await allService.login(formData);
            if (result.user.success || result.success) { // Handle potential API variations
                toast.success(`Welcome back!`, { icon: '🔓' });
                sessionStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('user', JSON.stringify(result.user));

                window.dispatchEvent(new Event('dashboard-login'));
                const target = result.user.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/employer/profile';
                navigate(target);
            }
        } catch (error) {
            toast.error(error.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-6 py-4 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none text-slate-900 transition-all font-bold bg-white";
    const labelClass = "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block";

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent)]">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/20 rotate-3">
                        <Briefcase className="w-10 h-10 text-primary -rotate-3" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Job Consultancy Center</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Professional Management Portal</p>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl space-y-8">
                    <div className="text-center">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Admin Secure Access</h2>
                        <div className="h-1 w-10 bg-primary mx-auto rounded-full"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input
                                type="email"
                                required
                                className={inputClass}
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Security Password</label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className={inputClass}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end mt-1">
                            <button
                                type="button"
                                onClick={() => navigate('/forgot-password')}
                                className="text-[10px] font-black text-primary hover:text-slate-900 uppercase tracking-widest transition-colors"
                            >
                                Forgot Password?
                            </button>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-4 shadow-xl disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            Authorized Access
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-slate-500 font-bold uppercase text-[9px] tracking-widest">
                    &copy; 2026 Job Consultancy Center. All Rights Reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;
