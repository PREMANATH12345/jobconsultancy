
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import {
    Briefcase,
    UserCircle,
    PlusSquare,
    LogOut,
    LayoutDashboard,
    Menu,
    X,
    ChevronRight,
    Home,
    FileText,
    Download,
    MessageSquare,
    Globe
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { allService } from '../../services/api';

const EmployerDashboardLayout = () => {
    const { t, language, toggleLanguage } = useLanguage();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const routerLocation = useLocation();

    // Immediate auth check
    const storedUser = JSON.parse(sessionStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'employer') {
        return <Navigate to="/login" replace />;
    }

    const [user] = useState(storedUser);
    const [newAppsCount, setNewAppsCount] = useState(0);

    useEffect(() => {
        setSidebarOpen(false); // Close sidebar on route change
    }, [routerLocation]);

    useEffect(() => {
        fetchNewApplicationsCount();

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
    }, [navigate]);

    const fetchNewApplicationsCount = async () => {
        try {
            // 1. Get employer's jobs
            const jobs = await allService.getData('jobs', { employer_id: user.id });
            if (!Array.isArray(jobs) || jobs.length === 0) return;

            const jobIds = jobs.map(j => j.id);

            // 2. Get all applications for these jobs with status 'applied'
            // Since the API doesn't support complex joins or ORs easily, 
            // we'll fetch all applications and filter, or fetch per job if count is small.
            // Best approach: Fetch all applications and filter by jobIds
            const allApps = await allService.getData('job_applications', { status: 'applied' });
            if (Array.isArray(allApps)) {
                const myUnreadApps = allApps.filter(app => jobIds.includes(app.job_id));
                setNewAppsCount(myUnreadApps.length);
            }
        } catch (error) {
            console.error("Failed to fetch notification count:", error);
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
        { name: t('overview') || 'Dashboard', path: '/employer/dashboard', icon: LayoutDashboard },
        { name: t('companyProfile') || 'Company Profile', path: '/employer/profile', icon: UserCircle },
        { name: t('postNewJob') || 'Post New Job', path: '/employer/post-job', icon: PlusSquare },
        { name: t('myJobs') || 'My Jobs', path: '/employer/my-jobs', icon: Briefcase },
        { name: t('manageReviews') || 'Manage Reviews', path: '/employer/reviews', icon: MessageSquare },
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

                        {/* Compact Branding */}
                        <Link to="/" className="flex items-center gap-3 mb-10 p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-black/5 shrink-0 group-hover:scale-110 transition-transform overflow-hidden">
                                <img src="/logo.PNG" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="font-black text-sm text-slate-900 uppercase tracking-tighter">{t('employerHub') || 'Employer Hub'}</span>
                        </Link>

                        {/* User Profile info */}
                        <div className="flex items-center gap-4 mb-4 px-2 pb-6 border-b border-slate-50">
                            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 overflow-hidden font-bold text-xl uppercase">
                                {user.name?.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <h2 className="font-bold text-slate-900 tracking-tight leading-none truncate text-lg">{user.name}</h2>
                                <p className="text-[11px] font-bold text-slate-400 tracking-wider mt-2 uppercase">{t('verifiedAccount') || 'Verified Account'}</p>
                            </div>
                        </div>

                        {/* Language Toggle in Sidebar */}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center justify-between w-full px-6 py-4 mb-6 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-700 text-[13px] hover:bg-slate-100 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <Globe className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
                                <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-30" />
                        </button>

                        <nav className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
                            {links.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    end={link.path === '/employer/dashboard'}
                                    className={({ isActive }) => `
                                        flex items-center justify-between px-6 py-4 rounded-2xl text-[13px] font-bold transition-all
                                        ${isActive
                                            ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-primary'}
                                    `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <link.icon className={`w-5 h-5`} />
                                            {link.name === (t('myJobs') || 'My Jobs') && newAppsCount > 0 && (
                                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-600 text-[8px] flex items-center justify-center text-white border border-white">
                                                        {newAppsCount}
                                                    </span>
                                                </span>
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
                <main className="flex-1 min-h-screen relative lg:pl-72 transition-all duration-300">
                    {/* Mobile Top Bar */}
                    <header className="lg:hidden fixed top-0 inset-x-0 h-20 bg-white shadow-sm border-b border-slate-100 z-50 flex items-center justify-between px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-900/20 active:scale-90 transition-all"
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
                            <Link to="/" className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100">
                                <span className="font-black text-[10px] text-slate-900 uppercase tracking-tighter">{t('employerHub') || 'Employer Hub'}</span>
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden">
                                    <img src="/logo.PNG" alt="Logo" className="w-full h-full object-contain" />
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

export default EmployerDashboardLayout;
