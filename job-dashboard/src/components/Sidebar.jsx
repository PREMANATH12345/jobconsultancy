
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Users,
    Briefcase,
    UserCircle,
    PlusSquare,
    LogOut,
    LayoutDashboard,
    CheckCircle,
    Clock,
    MessageSquare
} from 'lucide-react';

const Sidebar = ({ role, isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        navigate('/login');
    };

    // distinct colors for admin vs employer
    const bgColor = role === 'admin' ? 'bg-indigo-950' : 'bg-slate-900';
    const activeColor = role === 'admin' ? 'bg-indigo-600' : 'bg-primary';

    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Manage Employers', path: '/admin/employers', icon: Users },
        { name: 'Job Approvals', path: '/admin/jobs', icon: CheckCircle },
        { name: 'Government Jobs', path: '/admin/govt-jobs', icon: PlusSquare },
        // { name: 'Manage Reviews', path: '/admin/reviews', icon: MessageSquare },
    ];

    const employerLinks = [
        { name: 'My Profile', path: '/employer/profile', icon: UserCircle },
        { name: 'Post New Job', path: '/employer/post-job', icon: PlusSquare },
        { name: 'My Jobs', path: '/employer/my-jobs', icon: Briefcase },
        { name: 'Applied Candidates', path: '/employer/candidates', icon: Users },
    ];

    const links = role?.toLowerCase() === 'admin' ? adminLinks : employerLinks;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            <div className={`w-64 h-screen ${bgColor} text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-8 border-b border-white/10 flex justify-between items-center cursor-pointer">
                    <NavLink to="/" className="block hover:opacity-80 transition-opacity">
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Job Consultancy</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            {role === 'admin' ? 'Admin Console' : 'Employer Hub'}
                        </p>
                    </NavLink>
                </div>

                <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                    {links.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            onClick={() => onClose && onClose()} // Close on mobile click
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold uppercase transition-all ${isActive ? `${activeColor} text-white shadow-lg` : 'text-slate-400 hover:bg-white/5'
                                }`
                            }
                        >
                            <link.icon className="w-5 h-5" />
                            {link.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-6 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold uppercase text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                    <p className="text-center text-[10px] text-slate-600 mt-4 uppercase font-bold tracking-widest">v1.2.0 Beta</p>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
