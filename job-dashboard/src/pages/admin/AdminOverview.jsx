import React, { useState, useEffect } from 'react';
import { Users, Briefcase, CheckCircle, Clock, AlertCircle, TrendingUp, Landmark, Building2, ChevronRight } from 'lucide-react';
import { allService } from '../../services/api';

const AdminOverview = () => {
    const [stats, setStats] = useState({
        totalJobs: 0,
        pendingJobs: 0,
        approvedJobs: 0,
        rejectedJobs: 0,
        totalEmployers: 0,
        govtJobs: 0,
        privateJobs: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [jobsData, employersData] = await Promise.all([
                allService.getData('jobs'),
                allService.getData('users', { role: 'employer' })
            ]);

            const jobs = Array.isArray(jobsData) ? jobsData : [];
            const employers = Array.isArray(employersData) ? employersData : [];

            setStats({
                totalJobs: jobs.length,
                pendingJobs: jobs.filter(j => j.status === 'pending').length,
                approvedJobs: jobs.filter(j => j.status === 'approved').length,
                rejectedJobs: jobs.filter(j => j.status === 'rejected').length,
                totalEmployers: employers.length,
                govtJobs: jobs.filter(j => j.category === 'Government').length,
                privateJobs: jobs.filter(j => j.category === 'Private').length
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Jobs', value: stats.totalJobs, desc: 'Overall job listings', icon: <Briefcase className="w-8 h-8 text-white" />, color: 'from-blue-600 to-blue-400' },
        { label: 'Pending Approvals', value: stats.pendingJobs, desc: 'Require review', icon: <Clock className="w-8 h-8 text-white" />, color: 'from-amber-500 to-amber-300' },
        { label: 'Total Employers', value: stats.totalEmployers, desc: 'Company partners', icon: <Users className="w-8 h-8 text-white" />, color: 'from-purple-600 to-purple-400' },
        { label: 'Government Jobs', value: stats.govtJobs, desc: 'Public sector', icon: <Landmark className="w-8 h-8 text-white" />, color: 'from-emerald-600 to-emerald-400' },
        { label: 'Private Jobs', value: stats.privateJobs, desc: 'Corporate listings', icon: <Building2 className="w-8 h-8 text-white" />, color: 'from-rose-600 to-rose-400' },
        { label: 'Rejected List', value: stats.rejectedJobs, desc: 'Declined posts', icon: <AlertCircle className="w-8 h-8 text-white" />, color: 'from-slate-600 to-slate-400' },
    ];

    if (loading) {
        return <div className="p-10 text-center uppercase font-black text-slate-400 tracking-widest animate-pulse">Syncing Control Center...</div>;
    }

    return (
        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-12">
            <div className="text-left border-b border-slate-100 pb-8 md:pb-12">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight italic">Admin Dashboard</h1>
                <p className="text-sm md:text-base font-bold text-slate-400 mt-2 lowercase">Track your portal's performance and manage critical tasks with high precision.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-10">
                {statCards.map((card, idx) => (
                    <div key={idx} className={`bg-gradient-to-br ${card.color} p-0.5 rounded-[1.8rem] md:rounded-[3rem] shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-default group`}>
                        <div className="bg-white p-4 md:p-8 rounded-[1.75rem] md:rounded-[2.8rem] flex flex-col md:flex-row md:items-center justify-between h-full gap-3 md:gap-4 relative overflow-hidden">
                            <div className="text-left relative z-10">
                                <p className="text-[8px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">{card.label}</p>
                                <h3 className="text-2xl md:text-5xl font-black text-slate-900 mb-1 md:mb-2 leading-none">{card.value}</h3>
                                <p className="text-[8px] md:text-[11px] font-bold text-slate-400 lowercase tracking-tight leading-none">{card.desc}</p>
                            </div>
                            <div className={`p-3 md:p-5 rounded-xl md:rounded-3xl bg-gradient-to-br ${card.color} shadow-lg group-hover:rotate-6 transition-transform shrink-0 relative z-10 w-fit`}>
                                {iconWithClass(card.icon, "w-5 h-5 md:w-8 md:h-8")}
                            </div>
                            {/* Abstract background shape for mobile */}
                            <div className={`absolute -right-4 -bottom-4 w-12 h-12 rounded-full bg-gradient-to-br ${card.color} opacity-5 md:hidden`} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-10 text-left gap-4">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight italic">Standard Operations</h3>
                            <p className="text-xs md:text-sm font-bold text-slate-400 mt-1">Direct shortcuts to most used administration features.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a href="/admin/jobs" className="flex items-center gap-4 md:gap-6 p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group text-left">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-slate-900 uppercase tracking-tight text-sm md:text-base truncate">Review Jobs</p>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 lowercase truncate">Verify and publish posts</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                        </a>

                        <a href="/admin/employers" className="flex items-center gap-4 md:gap-6 p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group text-left">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-slate-900 uppercase tracking-tight text-sm md:text-base truncate">Manage Registry</p>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 lowercase truncate">Authorize new company partners</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                        </a>

                        <a href="/admin/govt-jobs" className="flex items-center gap-4 md:gap-6 p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group text-left">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0">
                                <Landmark className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-slate-900 uppercase tracking-tight text-sm md:text-base truncate">Govt Postings</p>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 lowercase truncate">Create & manage public sector jobs</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-all" />
                        </a>

                        <div className="flex items-center gap-4 md:gap-6 p-5 md:p-6 rounded-2xl md:rounded-3xl bg-slate-50 border border-slate-100 opacity-50 cursor-not-allowed text-left">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 shrink-0">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-slate-900 uppercase tracking-tight text-sm md:text-base truncate">Platform Settings</p>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 lowercase truncate">Global rules & configuration</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl text-white relative overflow-hidden flex flex-col justify-between border border-slate-800 text-left min-h-[300px]">
                    <div className="relative z-10">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center mb-6 md:mb-8 border border-white/10 shadow-inner">
                            <AlertCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 leading-tight italic">Admin Help Center</h3>
                        <p className="text-slate-400 font-bold mb-8 text-sm md:text-base leading-relaxed">Need help managing the system? Check out the documentation or contact support for advanced configuration. Our team is ready to assist.</p>
                    </div>

                    <button className="relative z-10 bg-emerald-500 text-white px-6 md:px-8 py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all w-full shadow-xl shadow-emerald-500/20 transform hover:scale-[1.02] active:scale-95">
                        Get Technical Assistance
                    </button>

                    <Briefcase className="absolute -bottom-10 -right-10 w-48 md:w-64 h-48 md:h-64 text-white/5 rotate-12" />
                </div>
            </div>
        </div>
    );
};

// Helper to pass classes to icons
const iconWithClass = (icon, className) => {
    return React.cloneElement(icon, { className: `${icon.props.className} ${className}` });
};

export default AdminOverview;
