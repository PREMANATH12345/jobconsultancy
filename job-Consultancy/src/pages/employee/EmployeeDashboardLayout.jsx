
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import {
    Briefcase,
    UserCircle,
    LogOut,
    LayoutDashboard,
    ChevronRight,
    Trophy,
    Menu,
    X,
    Home,
    Globe
} from 'lucide-react';
import { allService } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const EmployeeDashboardLayout = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const routerLocation = useLocation();

    // Immediate auth check
    const storedUser = JSON.parse(sessionStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'employee') {
        return <Navigate to="/login" replace />;
    }

    const [user] = useState(storedUser);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        setSidebarOpen(false); // Close sidebar on route change
    }, [routerLocation]);

    useEffect(() => {
        fetchNotifications(user.id);
        
        // Listen for internal session changes (e.g., if Name is updated in Profile)
        const syncSession = () => {
            const freshUser = JSON.parse(sessionStorage.getItem('user'));
            if (!freshUser) {
                navigate('/login');
            }
        };

        window.addEventListener('user-login', syncSession);
        return () => {
            window.removeEventListener('user-login', syncSession);
        };
    }, [navigate, user.id]);

    const fetchNotifications = async (userId) => {
        try {
            const result = await allService.getData('job_applications', {
                user_id: userId,
                is_notified: 0
            });
            const unread = Array.isArray(result) ? result.length : 0;
            setUnreadCount(unread);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        window.dispatchEvent(new Event('user-login'));
        navigate('/login');
    };

    const links = [
        { name: t('home'), path: '/', icon: Home },
        { name: t('overview') || 'Overview', path: '/employee/dashboard', icon: LayoutDashboard },
        { name: t('myApplications') || 'My Applications', path: '/employee/applications', icon: Briefcase },
        { name: t('editProfile'), path: '/employee/profile', icon: UserCircle },
    ];

    return (
        <div className="min-h-screen bg-slate-50 relative">
            <div className="flex min-h-screen">
                {/* Sidebar Backdrop for Mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed inset-y-0 left-0 z-[60] w-72 bg-white border-r border-slate-100 shadow-xl flex flex-col transition-all duration-300 transform
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}>
                    <div className="p-8 flex flex-col h-full">
                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 text-slate-400 lg:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Compact Branding - Green Theme */}
                        <Link to="/" className="flex items-center gap-3 mb-10 p-3 bg-emerald-50 rounded-2xl hover:bg-emerald-100 transition-colors group">
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0 group-hover:scale-110 transition-transform">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <span className="font-extrabold text-xs text-emerald-900 uppercase tracking-tighter leading-tight">{t('careerProgress') || 'Career\nProgress'}</span>
                        </Link>

                        {/* User Profile info */}
                        <div className="flex items-center gap-4 mb-4 px-2 pb-6 border-b border-slate-50">
                            <div className="w-14 h-14 bg-emerald-900 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 overflow-hidden font-bold text-xl uppercase">
                                {user.name?.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <h2 className="font-bold text-slate-900 tracking-tight leading-none truncate text-lg">{user.name}</h2>
                                <p className="text-[11px] font-bold text-emerald-600 tracking-wider mt-2 uppercase">{t('employeeAccount') || 'Employee Account'}</p>
                            </div>
                        </div>

                        {/* Language Toggle in Sidebar */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center justify-between w-full px-6 py-4 mb-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 text-[13px] hover:bg-emerald-50 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-emerald-500 group-hover:rotate-12 transition-transform" />
                                <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-30" />
                        </button>

                        <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
                            {links.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    end={link.path === '/employee/dashboard'}
                                    className={({ isActive }) => `
                                        flex items-center justify-between px-6 py-4 rounded-2xl text-[13px] font-bold transition-all
                                        ${isActive
                                            ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-[1.02]'
                                            : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <link.icon className={`w-5 h-5`} />
                                            {link.name === t('myApplications') && unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                                            )}
                                        </div>
                                        {link.name}
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-30" />
                                </NavLink>
                            ))}
                        </nav>

                        <div className="pt-8 border-t border-slate-50 mt-auto">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-bold text-red-500 hover:bg-red-50 transition-all group"
                            >
                                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span>{t('signOut') || 'Sign Out'}</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-h-screen relative lg:pl-72 transition-all duration-300 overflow-x-hidden">
                    {/* Mobile Top Bar */}
                    <header className="lg:hidden sticky top-0 inset-x-0 h-20 bg-white shadow-sm border-b border-slate-100 z-50 flex items-center justify-between px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleLanguage}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100"
                            >
                                <Globe className="w-5 h-5" />
                            </button>
                            <Link to="/" className="flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                                <span className="font-extrabold text-[10px] text-emerald-900 uppercase tracking-tighter leading-tight text-right italic font-black whitespace-pre-line">{t('careerProgress')}</span>
                                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                                    <Trophy className="w-4 h-4" />
                                </div>
                            </Link>
                        </div>
                    </header>

                    <div className="px-4 md:px-12 pb-12 max-w-7xl mx-auto pt-24 lg:pt-12">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EmployeeDashboardLayout;
