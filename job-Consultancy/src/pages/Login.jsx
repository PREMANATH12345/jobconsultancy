
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LogIn, Mail, Lock, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { allService } from '../services/api';

const Login = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'employee'
    });
    const [adminPath] = useState(import.meta.env.VITE_ADMIN_DASHBOARD_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5174/admin/dashboard' : '/dashboard/admin/dashboard'));

    useEffect(() => {
        const checkExistingUser = () => {
            const storedUserString = localStorage.getItem('user');
            if (storedUserString) {
                try {
                    const storedUser = JSON.parse(storedUserString);
                    if (storedUser && storedUser.role) {
                        if (storedUser.role === 'employer') {
                            navigate('/employer/dashboard');
                        } else if (storedUser.role === 'employee') {
                            navigate('/employee/dashboard');
                        } else if (storedUser.role === 'admin') {
                            window.location.href = adminPath;
                        }
                        // If role doesn't match known ones, stay on login
                    } else {
                        // Invalid user object, clear it
                        localStorage.removeItem('user');
                    }
                } catch (e) {
                    localStorage.removeItem('user');
                }
            }
        };

        checkExistingUser();
        window.addEventListener('storage', checkExistingUser);
        return () => window.removeEventListener('storage', checkExistingUser);
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await allService.login(formData);
            if (result.success) {
                toast.success(`${t('welcomeBack') || 'Welcome back!'} ${result.user.name}`, { icon: '🔓' });
                localStorage.setItem('user', JSON.stringify(result.user));
                window.dispatchEvent(new Event('user-login'));

                if (result.user.role === 'admin') {
                    window.location.href = adminPath;
                } else if (result.user.role === 'employer') {
                    navigate('/employer/dashboard');
                } else {
                    navigate('/employee/dashboard');
                }
            }
        } catch (error) {
            toast.error(error.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const isEmployee = formData.role === 'employee';

    const inputClass = (isEmp) => `w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 outline-none text-slate-900 transition-all text-sm font-bold disabled:opacity-50 ${isEmp
        ? 'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
        : 'focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
        }`;

    const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4 mb-2 block";

    return (
        <div className="min-h-screen flex items-center justify-center pt-24 px-4 bg-white relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-96 h-96 rounded-full -mr-48 -mt-48 blur-3xl opacity-50 transition-all duration-700 ${isEmployee ? 'bg-emerald-500/5' : 'bg-amber-500/5'}`} />
            <div className={`absolute bottom-0 left-0 w-96 h-96 rounded-full -ml-48 -mb-48 blur-3xl opacity-50 transition-all duration-700 ${isEmployee ? 'bg-emerald-500/5' : 'bg-amber-500/5'}`} />

            <div className="max-w-sm w-full relative">
                <div className={`bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-50 overflow-hidden`}>
                    <div className="text-center mb-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-inner transition-all duration-500 ${isEmployee ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                            <LogIn className={`w-8 h-8 ${isEmployee ? 'text-emerald-600' : 'text-amber-600'}`} />
                        </div>
                        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight uppercase">{t('memberLogin')}</h1>
                        <p className={`text-[10px] font-extrabold uppercase tracking-[0.3em] mt-2 ${isEmployee ? 'text-emerald-600' : 'text-amber-600'}`}>Portal Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl mb-4 border border-slate-100">
                            {['employee', 'employer'].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: r })}
                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === r
                                        ? `bg-white shadow-md ${isEmployee ? 'text-emerald-600' : 'text-amber-600'}`
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {t(r)}
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className={labelClass}>{t('emailId')}</label>
                            <input
                                required
                                type="email"
                                name="email"
                                autoComplete="username"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="name@email.com"
                                className={inputClass(isEmployee)}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>{t('password')}</label>
                            <div className="relative">
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="••••••••"
                                    className={inputClass(isEmployee)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors ${isEmployee ? 'hover:text-emerald-600' : 'hover:text-amber-600'}`}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="flex justify-end mt-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    className={`text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors ${isEmployee ? 'hover:text-emerald-600' : 'hover:text-amber-600'
                                        }`}
                                >
                                    {t('forgotPassword')}?
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3.5 rounded-2xl font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs text-white shadow-xl ${isEmployee
                                ? 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700'
                                : 'bg-amber-600 shadow-amber-500/20 hover:bg-amber-700'
                                }`}
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-5 h-5" />}
                            {loading ? 'Processing...' : t('secureLogin')}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-50 text-center">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">{t('needAccount')}</p>
                        <div className="flex justify-center gap-6">
                            <button onClick={() => navigate('/employee-register')} className="text-emerald-600 text-[10px] font-extrabold uppercase tracking-widest hover:underline">{t('registerSeeker')}</button>
                            <button onClick={() => navigate('/employer-register')} className="text-amber-500 text-[10px] font-extrabold uppercase tracking-widest hover:underline">{t('registerEmployer')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
