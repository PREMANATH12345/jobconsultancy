
import React, { useState, useEffect } from 'react';
import {
    Briefcase, Clock, CheckCircle2, Loader2,
    Building2, ExternalLink
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { allService } from '../../services/api';
import { slugify } from '../../utils/helpers';
import { useLanguage } from '../../contexts/LanguageContext';

const EmployeeDashboard = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [user] = useState(JSON.parse(sessionStorage.getItem('user')));
    const [stats, setStats] = useState({ applied: 0, shortlisted: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [recentApps, setRecentApps] = useState([]);

    useEffect(() => {
        if (!user || user.role !== 'employee') {
            navigate('/login');
            return;
        }
        fetchDashboardData();
    }, [user, navigate]);

    const fetchDashboardData = async () => {
        try {
            const result = await allService.getData('job_applications', { user_id: parseInt(user.id) });
            const apps = Array.isArray(result) ? result : [];

            setStats({
                applied: apps.length,
                shortlisted: apps.filter(a => a.status === 'shortlisted').length,
                rejected: apps.filter(a => a.status === 'rejected').length
            });

            // Sort applications by date descending (latest first)
            const sortedApps = [...apps].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Get last 5 applications with job details
            const last5 = sortedApps.slice(0, 5);
            const enhanced = await Promise.all(last5.map(async (app) => {
                try {
                    const jobData = await allService.getData('jobs', { id: app.job_id });
                    return { ...app, job: jobData[0] || null };
                } catch {
                    return { ...app, job: null };
                }
            }));
            setRecentApps(enhanced);

        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="mb-8 md:mb-10 text-center md:text-left">
                <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{t('welcomeBack')}, {user.name.split(' ')[0]}!</h1>
                <p className="text-sm md:text-base text-slate-500 font-bold mt-2">{t('dashboardSummary')}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {[
                    { label: t('totalApplied'), val: stats.applied, color: 'text-emerald-500', icon: <Briefcase /> },
                    { label: t('shortlisted'), val: stats.shortlisted, color: 'text-blue-500', icon: <CheckCircle2 /> },
                    { label: t('pendingReview'), val: stats.applied - stats.shortlisted - stats.rejected, color: 'text-amber-500', icon: <Clock /> },
                ].map((s, i) => (
                    <div key={i} className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-6 group hover:shadow-md transition-all text-center md:text-left">
                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center ${s.color} group-hover:scale-110 transition-transform`}>
                            {React.cloneElement(s.icon, { className: 'w-5 h-5 md:w-7 md:h-7' })}
                        </div>
                        <div>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-tight md:tracking-widest mb-1">{s.label}</p>
                            <p className="text-xl md:text-3xl font-extrabold text-slate-900">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Applications */}
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-sm border border-slate-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4">
                    <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">{t('recentActivity')}</h3>
                    <Link to="/employee/applications" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">{t('viewAllApps')}</Link>
                </div>

                {recentApps.length > 0 ? (
                    <div className="space-y-4">
                        {recentApps.map((app) => (
                            <div key={app.id} className="p-4 md:p-6 rounded-2xl md:rounded-[2rem] bg-slate-50/50 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 group hover:bg-white hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-slate-900 line-clamp-1">{app.job?.title || 'Unknown Position'}</h4>
                                        <div className="flex items-center gap-4 mt-1">
                                            <p className="text-xs font-bold text-slate-400">{app.job?.company_name || 'Company'}</p>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'shortlisted' ? 'bg-blue-100 text-blue-600' :
                                        app.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                            'bg-emerald-100 text-emerald-600'
                                        }`}>
                                        {app.status || t('underReview')}
                                    </span>
                                    <Link to={`/job/${slugify(app.job?.title || 'job')}-${app.job_id}`} className="p-3 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-500 transition-all">
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                        <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold lowercase">{t('noRecentApps')}</p>
                        <Link to="/jobs" className="inline-block mt-6 px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">{t('findJobs')}</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboard;
